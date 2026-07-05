import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security
from app.config import settings
from app.ai_services import run_vision_crop_analysis, mock_speech_to_text, translate_text
from app.expert_system import run_expert_diagnosis, DIAGNOSTIC_QUESTIONS

router = APIRouter(prefix="/api/cases", tags=["Crop Health & Cases"])

# Configure Allowed extensions and MIME types
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png"}
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".webm"}
ALLOWED_AUDIO_MIMES = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/webm", "application/octet-stream"}

def validate_and_save_file(file: UploadFile, allowed_exts: set, allowed_mimes: set, file_type: str) -> str:
    # 1. Validate File Size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB"
        )
        
    # 2. Validate Extension
    filename = file.filename or ""
    _, ext = os.path.splitext(filename.lower())
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed: {', '.join(allowed_exts)}"
        )
        
    # 3. Validate MIME type
    if file.content_type not in allowed_mimes:
        # Some devices might send files as octet-stream, we fallback to extension check,
        # but let's log or reject if completely mismatching
        pass

    # 4. Generate Unique Name and Save outside Web Root
    unique_filename = f"{file_type}_{uuid.uuid4().hex}{ext}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Path sanitization using basename
    safe_filename = os.path.basename(unique_filename)
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    with open(dest_path, "wb") as buffer:
        buffer.write(file.file.read())
        
    return safe_filename

@router.post("/upload-log", response_model=schemas.CropHealthLogResponse)
def upload_crop_log(
    description: str = Form(""),
    image: Optional[UploadFile] = File(None),
    voice: Optional[UploadFile] = File(None),
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    image_filename = None
    voice_filename = None
    
    if image:
        image_filename = validate_and_save_file(
            image, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_MIMES, "image"
        )
        
    if voice:
        voice_filename = validate_and_save_file(
            voice, ALLOWED_AUDIO_EXTENSIONS, ALLOWED_AUDIO_MIMES, "audio"
        )

    # If voice is uploaded, we simulate Whisper STT transcription to append to description
    transcribed_text = ""
    if voice_filename:
        full_voice_path = os.path.join(settings.UPLOAD_DIR, voice_filename)
        transcribed_text = mock_speech_to_text(full_voice_path)
        
    final_desc = description
    if transcribed_text:
        final_desc = f"{description} (Transcribed Voice: {transcribed_text})".strip()

    db_log = models.CropHealthLog(
        farmer_id=farmer.farmer_id,
        description=final_desc,
        image_path=image_filename,
        voice_path=voice_filename
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return db_log

@router.post("/diagnose", response_model=schemas.DiseaseDiagnosisResponse)
def diagnose_disease(
    req: schemas.DiseaseDiagnosisRequest,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    # Retrieve farmer's active crop from history
    crops = [c.strip() for c in farmer.crop_history.split(",") if c.strip()]
    active_crop = crops[0] if crops else "Rice" # Default to Rice if not recorded

    # Gather all symptoms
    symptoms = set(req.symptoms)
    
    # Process explicit follow-up question answers
    for ans in req.answers:
        if ans.answer:
            symptoms.add(ans.question_key)
        else:
            symptoms.discard(ans.question_key)
            
    # Run the rule-based expert system
    disease, confidence, treatment, matched, reasoning = run_expert_diagnosis(active_crop, list(symptoms))

    referred = False
    case_id = None
    
    # Auto-referral if confidence is below 70% (0.70)
    if confidence < 0.70:
        referred = True
        
        # Generate Unique Case ID
        current_year = datetime.datetime.now().year
        case_count = db.query(models.DiagnosisCase).count() + 1
        case_id = f"CASE-{current_year}-{case_count:06d}"
        
        db_case = models.DiagnosisCase(
            case_id=case_id,
            farmer_id=farmer.farmer_id,
            disease_name=disease,
            confidence=confidence,
            symptoms=",".join(symptoms),
            treatment=treatment,
            status="pending",
            priority="High"
        )
        db.add(db_case)
        db.commit()

    # Determine follow-up questions
    remaining_questions = []
    for q in DIAGNOSTIC_QUESTIONS:
        if q.key not in symptoms:
            remaining_questions.append(q)

    # Return results (with translated values if language is not English)
    translated_disease = translate_text(disease, farmer.preferred_lang)
    translated_treatment = translate_text(treatment, farmer.preferred_lang)
    translated_reasoning = translate_text(reasoning, farmer.preferred_lang)
    
    return schemas.DiseaseDiagnosisResponse(
        disease_name=translated_disease,
        confidence=confidence,
        symptoms_detected=list(symptoms),
        treatment_recommendation=translated_treatment,
        reasoning=translated_reasoning,
        referred_to_expert=referred,
        case_id=case_id,
        follow_up_questions=remaining_questions[:3] # Show up to 3 at a time
    )

@router.post("/refer-case", response_model=schemas.DiagnosisCaseResponse)
def manual_refer_case(
    disease_name: str,
    confidence: float,
    symptoms: str,
    treatment: str,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    # Manual expert help request
    current_year = datetime.datetime.now().year
    case_count = db.query(models.DiagnosisCase).count() + 1
    case_id = f"CASE-{current_year}-{case_count:06d}"
    
    db_case = models.DiagnosisCase(
        case_id=case_id,
        farmer_id=farmer.farmer_id,
        disease_name=disease_name,
        confidence=confidence,
        symptoms=symptoms,
        treatment=treatment,
        status="pending",
        priority="Critical" # Explicit request starts as Critical
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
    return db_case

@router.get("/my-cases", response_model=List[schemas.DiagnosisCaseResponse])
def get_farmer_cases(
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    cases = db.query(models.DiagnosisCase)\
        .filter(models.DiagnosisCase.farmer_id == farmer.farmer_id)\
        .order_by(models.DiagnosisCase.created_at.desc())\
        .all()
    return cases

@router.get("/media/{filename}")
def serve_media_file(
    filename: str,
    current_user: models.User = Depends(security.get_current_user)
):
    # Secure serving of files: checks if user is logged in first.
    # Path sanitization using basename
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file not found")
        
    return FileResponse(
        file_path,
        headers={
            "Content-Disposition": f"attachment; filename={safe_filename}",
            "X-Content-Type-Options": "nosniff"
        }
    )
