import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/api/farmers", tags=["Farmer Impact Engine"])

@router.get("/impact", response_model=schemas.ImpactCalculatorResponse)
def get_farmer_impact_metrics(
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    # Determine base values from farmer profile
    land_size = farmer.land_size or 2.0  # default to 2 acres
    soil_ph = farmer.soil_ph or 7.0
    irrigation = farmer.irrigation_method.lower()
    
    # 1. Yield Improvement calculation
    # Better pH and soil structure = higher improvement potential
    if 6.0 <= soil_ph <= 7.2:
        yield_pct = 18
    else:
        yield_pct = 12
        
    # 2. Water Savings calculation
    # Drip/Sprinkler methods already save water; we help optimize them further, 
    # but Rainfed/Flood has the biggest optimization potential with scheduling
    if "drip" in irrigation or "sprinkler" in irrigation:
        water_pct = 15
    else:
        water_pct = 25
        
    # 3. Disease reduction calculation
    # Dependent on disease history in district/village
    case_count = db.query(models.DiagnosisCase).filter(models.DiagnosisCase.farmer_id == farmer.farmer_id).count()
    if case_count > 0:
        disease_red_pct = 32  # High reduction after diagnostic treatment advice
    else:
        disease_red_pct = 20  # Preventative reduction
        
    # 4. Seasonal Profit Estimation (INR)
    # Scaled by land size. Average yield boost value is estimated at ~INR 6,000 per acre
    profit_est = int(land_size * 6000 + (disease_red_pct * 150))
    
    # Ensure minimums/caps
    yield_pct = max(5, min(yield_pct, 45))
    water_pct = max(5, min(water_pct, 50))
    disease_red_pct = max(10, min(disease_red_pct, 60))
    profit_est = max(1000, profit_est)

    return schemas.ImpactCalculatorResponse(
        yield_increase_pct=yield_pct,
        water_savings_pct=water_pct,
        disease_reduction_pct=disease_red_pct,
        profit_increase_inr=profit_est
    )
