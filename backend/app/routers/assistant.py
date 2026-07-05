import logging
import csv
import os
import io
import requests as http_requests
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security
from app.config import settings

# Conditional import for Gemini API
GEMINI_AVAILABLE = False
try:
    if settings.GEMINI_API_KEY:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
except Exception as e:
    logging.warning(f"Failed to configure Gemini API: {e}")

router = APIRouter(prefix="/api/assistant", tags=["Kisan AI Assistant"])

# Path to the local expert knowledge base CSV
EXPERT_KB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "expert_kb.csv")

# Google Sheet published CSV URL - Update this with your actual sheet export URL
# Format: https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=0
GOOGLE_SHEET_CSV_URL: Optional[str] = os.environ.get(
    "GOOGLE_SHEET_CSV_URL",
    None  # Set this env var to enable live Google Sheet syncing
)

def sync_from_google_sheet() -> dict:
    """Pull new Q&A rows from the published Google Sheet and merge into local CSV."""
    if not GOOGLE_SHEET_CSV_URL:
        return {"status": "skipped", "reason": "GOOGLE_SHEET_CSV_URL not configured"}
    
    try:
        resp = http_requests.get(GOOGLE_SHEET_CSV_URL, timeout=10)
        resp.raise_for_status()
        
        # Read existing local KB entries as set of (Question, Language) to avoid duplicates
        existing = set()
        local_rows = []
        if os.path.exists(EXPERT_KB_PATH):
            with open(EXPERT_KB_PATH, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = (row.get("Question", "").strip().lower(), row.get("Language", "en").lower())
                    existing.add(key)
                    local_rows.append(row)
        
        # Parse Google Sheet CSV - expects columns: Question, Answer, Category, Language
        new_rows = []
        content = resp.content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            q = row.get("Question", "").strip()
            a = row.get("Answer", "").strip()
            c = row.get("Category", "General").strip()
            l = row.get("Language", "en").strip().lower()
            if q and a:
                key = (q.lower(), l)
                if key not in existing:
                    new_rows.append({"Question": q, "Answer": a, "Category": c, "Language": l})
                    existing.add(key)
        
        if new_rows:
            all_rows = local_rows + new_rows
            with open(EXPERT_KB_PATH, mode="w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=["Question", "Answer", "Category", "Language"])
                writer.writeheader()
                writer.writerows(all_rows)
            logging.info(f"Synced {len(new_rows)} new Q&As from Google Sheet.")
            return {"status": "synced", "new_entries": len(new_rows)}
        
        return {"status": "up_to_date", "new_entries": 0}
    
    except Exception as e:
        logging.error(f"Google Sheet sync failed: {e}")
        return {"status": "error", "reason": str(e)}


def search_expert_kb(query: str, lang: str) -> Optional[str]:
    """Search local expert_kb.csv using keyword matching. Returns answer or None."""
    if not os.path.exists(EXPERT_KB_PATH):
        return None
    
    query_lower = query.lower()
    try:
        with open(EXPERT_KB_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        # Pass 1: Exact language match + keyword overlap
        for row in rows:
            q_val = row.get("Question", "").lower()
            ans_val = row.get("Answer", "")
            lang_val = row.get("Language", "en").lower()
            if lang_val == lang.lower():
                q_words = [w for w in q_val.replace("?", "").split() if len(w) > 3]
                if q_words and any(w in query_lower for w in q_words):
                    return f"✅ Expert Verified: {ans_val}"
        
        # Pass 2: English fallback regardless of farmer lang (for cross-lingual queries)
        for row in rows:
            q_val = row.get("Question", "").lower()
            ans_val = row.get("Answer", "")
            lang_val = row.get("Language", "en").lower()
            if lang_val == "en":
                q_words = [w for w in q_val.replace("?", "").split() if len(w) > 3]
                if q_words and any(w in query_lower for w in q_words):
                    return f"✅ Expert Verified: {ans_val}"
    except Exception as e:
        logging.warning(f"Expert KB search error: {e}")
    
    return None


@router.post("/sync-qa")
def sync_expert_qa(background_tasks: BackgroundTasks):
    """
    Trigger a sync from the linked Google Sheet to update the local expert Q&A knowledge base.
    Can be called manually or via a Google Apps Script webhook on form submit.
    """
    result = sync_from_google_sheet()
    return {"message": "Knowledge base sync complete.", "result": result}


@router.get("/kb-stats")
def get_kb_stats():
    """Return count of expert Q&As currently in the knowledge base by language."""
    if not os.path.exists(EXPERT_KB_PATH):
        return {"total": 0, "by_language": {}}
    stats = {}
    total = 0
    try:
        with open(EXPERT_KB_PATH, mode="r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lang = row.get("Language", "en").lower()
                stats[lang] = stats.get(lang, 0) + 1
                total += 1
    except Exception:
        pass
    return {"total": total, "by_language": stats}


def get_fallback_response(query: str, lang: str, farmer: models.FarmerProfile, db: Session) -> str:
    query_lower = query.lower()
    
    # 0. Search Expert Q&A Knowledge Base (from Google Form / Sheet)
    kb_answer = search_expert_kb(query, lang)
    if kb_answer:
        return kb_answer
        
    crops = [c.strip() for c in farmer.crop_history.split(",") if c.strip()]
    active_crop = crops[0] if crops else "crops"
    
    # 1. Handle Case status inquiries
    if any(k in query_lower for k in ["case", "status", "ticket", "expert", "officer", "remarks", "रिपोर्ट", "मामला", "disease"]):
        cases = db.query(models.DiagnosisCase).filter(models.DiagnosisCase.farmer_id == farmer.farmer_id).order_by(models.DiagnosisCase.created_at.desc()).all()
        if cases:
            latest = cases[0]
            status_str = latest.status.upper()
            remarks_str = f" Remarks: '{latest.officer_remarks}'" if latest.officer_remarks else " No officer remarks yet."
            if lang == "hi":
                return f"नमस्ते {farmer.name}, आपके नवीनतम मामले ({latest.case_id} - {latest.disease_name}) की स्थिति {status_str} है।{remarks_str}"
            elif lang == "te":
                return f"నమస్తే {farmer.name}, మీ తాజా కేసు ({latest.case_id} - {latest.disease_name}) స్థితి {status_str}.{remarks_str}"
            elif lang == "ml":
                return f"ഹലോ {farmer.name}, നിങ്ങളുടെ ഏറ്റവും പുതിയ കേസ് ({latest.case_id} - {latest.disease_name}) നില: {status_str}.{remarks_str}"
            return f"Hello {farmer.name}, your latest case ({latest.case_id} for {latest.disease_name}) is currently {status_str}.{remarks_str}"
        else:
            if lang == "hi":
                return f"नमस्ते {farmer.name}, आपके पास कोई सक्रिय अधिकारी समीक्षा मामले दर्ज नहीं हैं।"
            return f"Hello {farmer.name}, you do not have any active expert review tickets filed."

    # 2. Handle Weather inquiries
    if any(k in query_lower for k in ["weather", "rain", "temperature", "forecast", "wind", "मौसम", "मजा", "മഴ", "వాతావరణం"]):
        alerts = db.query(models.AlertHistory).filter(models.AlertHistory.farmer_id == farmer.farmer_id).order_by(models.AlertHistory.sent_at.desc()).limit(2).all()
        alert_text = ". ".join([a.message for a in alerts]) if alerts else "No active weather warnings. System is running normally."
        if lang == "hi":
            return f"नमस्ते {farmer.name}, आपके गाँव {farmer.village} के मौसम के बारे में: {alert_text}"
        return f"Hello {farmer.name}, regarding weather forecast for {farmer.village}: {alert_text}"

    # 3. Handle Crop/Soil advice inquiries
    if any(k in query_lower for k in ["crop", "soil", "ph", "seed", "grow", "फसल", "मिट्टी", "വിള", "പണ്ട"]):
        if lang == "hi":
            return f"नमस्ते {farmer.name}, आपकी {farmer.soil_type} मिट्टी (pH {farmer.soil_ph}) पर {active_crop} के लिए सलाह: मिट्टी में पर्याप्त नमी बनाए रखें। इष्टतम पोषक तत्वों के उठाव के लिए यूरिया का संतुलित मात्रा में उपयोग करें।"
        return f"Hello {farmer.name}, for growing {active_crop} on your {farmer.soil_type} soil (pH {farmer.soil_ph}): Maintain adequate moisture and balance N:P:K fertilizer ratios based on periodic soil testing."

    # 4. Handle Irrigation inquiries
    if any(k in query_lower for k in ["irrigate", "water", "drip", "sprinkler", "सिंचाई", "पानी", "നന", "നീరు"]):
        if lang == "hi":
            return f"नमस्ते {farmer.name}, आपकी {farmer.irrigation_method} सिंचाई प्रणाली के लिए: वाष्पीकरण को कम करने के लिए सुबह या शाम को सिंचाई करना सुनिश्चित करें।"
        return f"Hello {farmer.name}, concerning irrigation for your {farmer.irrigation_method} method: Schedule watering sessions in the early morning or evening to minimize water evaporation."

    # 5. Default greeting
    if lang == "hi":
        return f"नमस्ते {farmer.name}! मैं आपका किसान सहायक हूँ। मैं आपके {active_crop} फसल और {farmer.soil_type} मिट्टी की स्थिति से परिचित हूँ। आप मुझसे मौसम, सिंचाई या रोग निदान के बारे में पूछ सकते हैं।"
    elif lang == "te":
        return f"నమస్తే {farmer.name}! నేను మీ కిసాన్ సహాయకుడిని. మీ {active_crop} పంట మరియు {farmer.soil_type} నేల గురించి నాకు తెలుసు. నన్ను వాతావరణం లేదా నీటి యాజమాన్యం గురించి అడగండి."
    elif lang == "ml":
        return f"ഹലോ {farmer.name}! ഞാൻ നിങ്ങളുടെ കിസാൻ അസിസ്റ്റന്റാണ്. നിങ്ങളുടെ {active_crop} വിളയെക്കുറിച്ചും {farmer.soil_type} മണ്ണിനെക്കുറിച്ചും എനിക്കറിയാം. വിളകളെക്കുറിച്ചോ രോഗങ്ങളെക്കുറിച്ചോ ചോദിക്കാം."
    return f"Hello {farmer.name}! I am your Kisan Assistant. I am familiar with your crop {active_crop} and {farmer.soil_type} soil setup. Ask me about weather updates, crop health advice, or irrigation tips!"

@router.post("/chat", response_model=schemas.ChatMessageResponse)
def ask_assistant(
    msg_input: schemas.ChatMessageInput,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    user_query = msg_input.message
    
    # If a voice input is simulated (base64 or just triggers voice path), transcribe first
    if msg_input.voice_base64:
        user_query = "Transcribed speech query: My crops are having leaves yellowing"
        
    # Write User query to history
    user_chat = models.ChatHistory(
        farmer_id=farmer.farmer_id,
        role="user",
        content=user_query,
        language=farmer.preferred_lang
    )
    db.add(user_chat)
    db.commit()

    bot_response = ""
    
    # 1. Try Gemini API with detailed profile context injected
    if GEMINI_AVAILABLE:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            system_instruction = (
                "You are 'KisanVriddhi', a multilingual agricultural intelligence assistant for Indian farmers. "
                f"The farmer's preferred language is {farmer.preferred_lang}. Respond to their query about crops, "
                "diseases, weather, irrigation, or fertilizers directly and warmly. Keep responses to under 4 sentences, "
                "extremely practical, and use simple bullet points if explaining actions. "
                f"Context for this farmer: Name: {farmer.name}, State: {farmer.state}, Soil Type: {farmer.soil_type}, "
                f"pH: {farmer.soil_ph}, Land Size: {farmer.land_size} acres, Irrigation Method: {farmer.irrigation_method}, "
                f"Groundwater Depth: {farmer.groundwater_depth}m, Crop History: {farmer.crop_history}."
            )
            response = model.generate_content(
                contents=[{"role": "user", "parts": [f"{system_instruction}\n\nQuery: {user_query}"]}]
            )
            bot_response = response.text
        except Exception as e:
            # Fallback to local rule engine on error
            bot_response = get_fallback_response(user_query, farmer.preferred_lang, farmer, db)
    else:
        # 2. Fallback to mock intelligence
        bot_response = get_fallback_response(user_query, farmer.preferred_lang, farmer, db)

    # Write Assistant response to history
    assistant_chat = models.ChatHistory(
        farmer_id=farmer.farmer_id,
        role="assistant",
        content=bot_response,
        language=farmer.preferred_lang
    )
    db.add(assistant_chat)
    db.commit()

    # Generate mock TTS URL if speech response is simulated
    voice_url = f"/api/cases/media/mock_voice_response_{farmer.preferred_lang}.mp3"

    return schemas.ChatMessageResponse(
        response=bot_response,
        voice_response_url=voice_url,
        translated_response=None
    )

@router.get("/history", response_model=List[schemas.CropHealthLogResponse])
def get_chat_history(
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    chats = db.query(models.ChatHistory)\
        .filter(models.ChatHistory.farmer_id == farmer.farmer_id)\
        .order_by(models.ChatHistory.created_at.asc())\
        .all()
        
    return [
        {
            "id": c.id,
            "farmer_id": c.farmer_id,
            "description": f"[{c.role.upper()}] {c.content}",
            "image_path": None,
            "voice_path": None,
            "created_at": c.created_at
        }
        for c in chats
    ]


@router.post("/contact-officer", response_model=schemas.FarmerMessageResponse)
def contact_officer(
    payload: schemas.ContactOfficerInput,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    """
    Farmer sends a direct message to the officer team when the chatbot cannot resolve their issue.
    Creates an open ticket visible in Officer Dashboard → Farmer Messages tab.
    """
    msg = models.FarmerMessage(
        farmer_id=farmer.farmer_id,
        farmer_name=farmer.name,
        message=payload.message,
        language=farmer.preferred_lang,
        status="open"
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/my-officer-replies", response_model=List[schemas.FarmerMessageResponse])
def get_my_officer_replies(
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    """Farmer retrieves all their messages to officers and any officer replies."""
    msgs = db.query(models.FarmerMessage)\
        .filter(models.FarmerMessage.farmer_id == farmer.farmer_id)\
        .order_by(models.FarmerMessage.created_at.desc()).all()
    return msgs

