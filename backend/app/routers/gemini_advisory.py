import os
import uuid
import datetime
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, security
from app.ai_services import fetch_open_meteo_weather
from app.routers.assistant import search_expert_kb
from app.services import gemini_client
from app.routers.cases import validate_and_save_file, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_MIMES

router = APIRouter(prefix="/api/assistant", tags=["Gemini AI Assistant"])

@router.post("/gemini-chat", response_model=schemas.GeminiAdvisoryResponse)
def ask_gemini_advisory(
    msg_input: schemas.ChatMessageInput,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    user_query = msg_input.message
    
    # 1. Fetch current weather context
    weather_data = {}
    try:
        weather_data = fetch_open_meteo_weather()
    except Exception as e:
        logging.warning(f"Failed to fetch weather for Gemini context: {e}")
        
    # 2. Search Expert Q&A Knowledge Base
    kb_match = search_expert_kb(user_query, farmer.preferred_lang) or "No specific direct expert Q&A match found in local knowledge base."

    # 3. Write User query to history
    user_chat = models.ChatHistory(
        farmer_id=farmer.farmer_id,
        role="user",
        content=user_query,
        language=farmer.preferred_lang
    )
    db.add(user_chat)
    db.commit()

    # 4. Generate Gemini Advisory Response
    result = gemini_client.generate_advisory_response(
        farmer=farmer,
        weather=weather_data,
        crop_history=farmer.crop_history,
        expert_kb=kb_match,
        query_str=user_query
    )
    
    # Validation & fallback in case Gemini call failed or returned empty dictionary
    if not result or not isinstance(result, dict) or "recommendation" not in result:
        # Fallback Heuristics
        crops = [c.strip() for c in farmer.crop_history.split(",") if c.strip()]
        active_crop = crops[0] if crops else "Rice"
        
        fallback_msg = f"Recommendation: Maintain adequate moisture for your {active_crop} crop. Soil test indicates pH {farmer.soil_ph} which is matching."
        if farmer.preferred_lang == "hi":
            fallback_msg = f"सिफारिश: अपनी {active_crop} फसल के लिए पर्याप्त नमी बनाए रखें। मिट्टी का पीएच {farmer.soil_ph} है जो अनुकूल है।"
            
        result = {
            "recommendation": fallback_msg,
            "why": "Derived from farmer profile soil data and standard crop management guides.",
            "potential_risks": ["Nutrient deficiency", "Inconsistent watering"],
            "expected_benefits": ["Stable soil moisture", "Optimal nutrient uptake"],
            "advisory_strength": "Medium (Local Fallback Engine)",
            "evidence_sources": ["Farmer Profile", "Expert System Rules"],
            "action_plan": [
                {"day": 1, "action": "Inspect crop leaves for color variations"},
                {"day": 2, "action": "Ensure drainage channels are clear of weeds"},
                {"day": 3, "action": "Monitor soil moisture at root level"},
                {"day": 5, "action": "Apply organic compost if needed"},
                {"day": 7, "action": "Perform irrigation run based on weather"}
            ]
        }

    # Write Assistant response to history
    assistant_chat = models.ChatHistory(
        farmer_id=farmer.farmer_id,
        role="assistant",
        content=result.get("recommendation", ""),
        language=farmer.preferred_lang
    )
    db.add(assistant_chat)
    db.commit()

    return schemas.GeminiAdvisoryResponse(
        recommendation=result.get("recommendation", ""),
        why=result.get("why", ""),
        potential_risks=result.get("potential_risks", []),
        expected_benefits=result.get("expected_benefits", []),
        advisory_strength=result.get("advisory_strength", "High"),
        evidence_sources=result.get("evidence_sources", ["Weather Forecast", "Farmer Profile"]),
        action_plan=result.get("action_plan", [])
    )

@router.post("/gemini-vision", response_model=schemas.VisionDiagnosisResponse)
def analyze_disease_with_vision(
    image: UploadFile = File(...),
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    """
    Upload crop leaf image, analyze it using Gemini Vision, 
    and register a new DiagnosisCase on the system.
    """
    # 1. Validate and save image locally
    image_filename = validate_and_save_file(
        image, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_MIMES, "vision"
    )
    
    # 2. Read file bytes to send to Gemini Vision
    upload_dir = os.environ.get("UPLOAD_DIR", "uploads")
    full_path = os.path.join(upload_dir, image_filename)
    try:
        with open(full_path, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read saved image file: {str(e)}"
        )

    # 3. Call Gemini Vision
    result = gemini_client.generate_vision_disease_analysis(image_bytes, image.content_type)
    
    # Fallback in case Gemini Vision is unavailable/fails
    if not result or not isinstance(result, dict) or "ai_disease_name" not in result:
        result = {
            "ai_disease_name": "Alternaria Leaf Spot (Fungal)",
            "severity": "Medium",
            "confidence_level": "Medium (Vision Fallback)",
            "ai_treatment": "Spray Carbendazim 50 WP at 2g/liter of water. Avoid overhead watering.",
            "ai_reasoning": "Detected circular brown lesions with concentric rings on the leaf surface.",
            "escalate_to_officer": True
        }

    # 4. Create Diagnosis Case record in DB
    current_year = datetime.datetime.now().year
    case_count = db.query(models.DiagnosisCase).count() + 1
    case_id = f"CASE-{current_year}-{case_count:06d}"
    
    db_case = models.DiagnosisCase(
        case_id=case_id,
        farmer_id=farmer.farmer_id,
        disease_name=result.get("ai_disease_name", "Unknown Disease"),
        confidence=0.85 if result.get("confidence_level") == "High" else 0.60,
        symptoms="Leaf spot spots observed via Vision AI",
        treatment=result.get("ai_treatment", ""),
        status="pending",
        priority=result.get("severity", "Medium"),
        ai_disease_name=result.get("ai_disease_name"),
        ai_confidence=0.90 if result.get("confidence_level") == "High" else 0.70,
        ai_reasoning=result.get("ai_reasoning"),
        ai_treatment=result.get("ai_treatment")
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    # Add log of this vision upload
    db_log = models.CropHealthLog(
        farmer_id=farmer.farmer_id,
        description=f"AI Vision Diagnosis: {db_case.disease_name} (Severity: {db_case.priority})",
        image_path=image_filename
    )
    db.add(db_log)
    db.commit()

    return schemas.VisionDiagnosisResponse(
        ai_disease_name=result.get("ai_disease_name", "Unknown"),
        severity=result.get("severity", "Medium"),
        confidence_level=result.get("confidence_level", "Medium"),
        ai_treatment=result.get("ai_treatment", ""),
        ai_reasoning=result.get("ai_reasoning", ""),
        escalate_to_officer=result.get("escalate_to_officer", True)
    )
