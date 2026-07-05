from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/api/officer", tags=["Officer Dashboard"])

@router.get("/farmers", response_model=List[schemas.FarmerProfileResponse])
def get_farmer_directory(
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    farmers = db.query(models.FarmerProfile).all()
    return farmers

@router.get("/cases", response_model=List[schemas.DiagnosisCaseResponse])
def get_all_cases(
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    cases = db.query(models.DiagnosisCase).order_by(models.DiagnosisCase.created_at.desc()).all()
    
    # Enrich case data with farmer names and mobile numbers for the officer to see
    enriched_cases = []
    for c in cases:
        farmer = db.query(models.FarmerProfile).filter(models.FarmerProfile.farmer_id == c.farmer_id).first()
        res = schemas.DiagnosisCaseResponse.from_orm(c)
        if farmer:
            res.farmer_name = farmer.name
            res.farmer_mobile = farmer.mobile
        enriched_cases.append(res)
        
    return enriched_cases

@router.put("/cases/{case_id}/status", response_model=schemas.DiagnosisCaseResponse)
def update_case_status(
    case_id: str,
    status_update: schemas.CaseStatusUpdate,
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    db_case = db.query(models.DiagnosisCase).filter(models.DiagnosisCase.case_id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Diagnosis case not found")
        
    db_case.status = status_update.status
    if status_update.status == "resolved":
        db_case.assigned_officer_id = officer.id
        
    db.commit()
    db.refresh(db_case)
    return db_case

@router.put("/cases/{case_id}/remarks", response_model=schemas.DiagnosisCaseResponse)
def update_case_remarks(
    case_id: str,
    remark_update: schemas.CaseRemarkUpdate,
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    db_case = db.query(models.DiagnosisCase).filter(models.DiagnosisCase.case_id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Diagnosis case not found")
        
    db_case.officer_remarks = remark_update.remarks
    db_case.assigned_officer_id = officer.id
    
    db.commit()
    db.refresh(db_case)
    return db_case

@router.get("/reports/diseases")
def get_disease_report(
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    # Aggregated query of diseases diagnosed in the database for charting
    cases = db.query(models.DiagnosisCase).all()
    report = {}
    for c in cases:
        report[c.disease_name] = report.get(c.disease_name, 0) + 1
        
    # Return formatted list for Recharts
    return [{"name": name, "count": count} for name, count in report.items()]

@router.get("/reports/weather-impact")
def get_weather_impact_report(
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    # Aggregated query of recent alerts sent to farmers
    alerts = db.query(models.AlertHistory).all()
    report = {}
    for a in alerts:
        report[a.type] = report.get(a.type, 0) + 1
        
    return [{"alert_type": type_name, "count": count} for type_name, count in report.items()]


@router.get("/farmer-messages", response_model=List[schemas.FarmerMessageResponse])
def get_farmer_messages(
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    """Officer views all incoming farmer direct messages (open tickets)."""
    msgs = db.query(models.FarmerMessage)\
        .order_by(models.FarmerMessage.created_at.desc()).all()
    return msgs


@router.put("/farmer-messages/{msg_id}/reply", response_model=schemas.FarmerMessageResponse)
def reply_to_farmer(
    msg_id: int,
    payload: schemas.OfficerReplyInput,
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    """Officer replies to a farmer's direct message. Updates status to 'replied'."""
    import datetime
    msg = db.query(models.FarmerMessage).filter(models.FarmerMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.officer_reply = payload.reply
    msg.replied_by = officer.username
    msg.status = "replied"
    msg.replied_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg


@router.put("/farmer-messages/{msg_id}/close")
def close_farmer_message(
    msg_id: int,
    officer: models.User = Depends(security.get_current_officer),
    db: Session = Depends(get_db)
):
    """Officer closes/resolves a farmer message ticket."""
    msg = db.query(models.FarmerMessage).filter(models.FarmerMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.status = "closed"
    db.commit()
    return {"message": "Ticket closed successfully."}
