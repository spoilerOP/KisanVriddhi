from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security
from app.ai_services import fetch_open_meteo_weather

router = APIRouter(prefix="/api/farmers", tags=["Farmers"])

@router.get("/profile", response_model=schemas.FarmerProfileResponse)
def get_profile(
    farmer: models.FarmerProfile = Depends(security.get_current_farmer)
):
    return farmer

@router.put("/profile", response_model=schemas.FarmerProfileResponse)
def update_profile(
    profile_update: schemas.FarmerProfileUpdate,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    farmer.land_size = profile_update.land_size
    farmer.soil_type = profile_update.soil_type
    farmer.soil_ph = profile_update.soil_ph
    farmer.irrigation_method = profile_update.irrigation_method
    farmer.groundwater_depth = profile_update.groundwater_depth
    farmer.crop_history = profile_update.crop_history
    
    db.commit()
    db.refresh(farmer)
    return farmer

@router.get("/dashboard")
def get_dashboard(
    farmer: models.FarmerProfile = Depends(security.get_current_farmer),
    db: Session = Depends(get_db)
):
    # 1. Fetch current weather from Open-Meteo
    weather_data = fetch_open_meteo_weather()
    temp = weather_data.get("temperature", 30.0)
    humidity = weather_data.get("humidity", 60.0)
    rain_prob = weather_data.get("rain_probability", 40.0)
    wind_speed = weather_data.get("wind_speed", 12.0)
    dry_spell_risk = weather_data.get("dry_spell_risk", "Low")
    
    # 2. Automated Weather Alert Generation Service & Severity Assignment
    # Alert Schema: { type, message, severity, recommendation }
    generated_alerts = []
    
    if temp > 42.0:
        generated_alerts.append({
            "type": "Heat Wave",
            "severity": "Critical",
            "message": f"Extreme heat wave detected: forecasted temp {temp}°C in Bhatinda.",
            "recommendation": "Suspend field operations from 11 AM to 4 PM. Apply light sprinkler watering to prevent crop scorch."
        })
    elif temp > 38.0:
        generated_alerts.append({
            "type": "Heat Wave",
            "severity": "High",
            "message": f"Severe temperature surge: forecasted temp {temp}°C.",
            "recommendation": "Mulch soil beds immediately to protect root microclimate from high evaporation rates."
        })

    if rain_prob > 85.0:
        generated_alerts.append({
            "type": "Heavy Rain",
            "severity": "Critical",
            "message": f"Extreme rainfall forecast ({rain_prob}%) expects high surface runoff.",
            "recommendation": "Clear bunds and open secondary field drains to channel excess water out immediately."
        })
    elif rain_prob > 60.0:
        generated_alerts.append({
            "type": "Heavy Rain",
            "severity": "High",
            "message": f"Heavy storm forecast detected ({rain_prob}% probability).",
            "recommendation": "Postpone any immediate top-dressing fertilizer treatments to prevent chemical leaching."
        })

    if wind_speed > 35.0:
        generated_alerts.append({
            "type": "Strong Wind",
            "severity": "High",
            "message": f"High velocity wind gusts ({wind_speed} km/h) forecasted.",
            "recommendation": "Provide stake support for tall crops (like sugarcane or maize) to prevent lodging."
        })
    elif wind_speed > 25.0:
        generated_alerts.append({
            "type": "Strong Wind",
            "severity": "Medium",
            "message": f"Moderate winds ({wind_speed} km/h) expected.",
            "recommendation": "Secure shade netting covers and check greenhouse frames."
        })

    if dry_spell_risk == "High":
        generated_alerts.append({
            "type": "Dry Spell",
            "severity": "High",
            "message": "Zero precipitation and dry atmospheric conditions forecast for the next 7 days.",
            "recommendation": "Irrigate crop fields within 24 hours. Drip irrigation is highly recommended to save water."
        })
    elif dry_spell_risk == "Medium":
        generated_alerts.append({
            "type": "Dry Spell",
            "severity": "Medium",
            "message": "Dry winds and lack of rainfall expected for 5 days.",
            "recommendation": "Apply soil straw mulch to prevent soil drying out."
        })

    # Save generated alerts to DB AlertHistory if they don't already exist for today
    for alert in generated_alerts:
        exists = db.query(models.AlertHistory).filter(
            models.AlertHistory.farmer_id == farmer.farmer_id,
            models.AlertHistory.type == alert["type"],
            models.AlertHistory.message == alert["message"]
        ).first()
        
        if not exists:
            db_alert = models.AlertHistory(
                farmer_id=farmer.farmer_id,
                type=alert["type"],
                message=f"[{alert['severity']}] {alert['message']} Recommended: {alert['recommendation']}"
            )
            db.add(db_alert)
            db.commit()

    # Re-fetch alert logs from DB for the dashboard display
    recent_alerts = db.query(models.AlertHistory)\
        .filter(models.AlertHistory.farmer_id == farmer.farmer_id)\
        .order_by(models.AlertHistory.sent_at.desc())\
        .limit(5)\
        .all()

    # 3. Calculate Farmer Risk Metrics (Weather, Water, Disease, Overall)
    # A. Weather Risk
    weather_risk_level = "Low"
    weather_points = 10
    if any(a["severity"] == "Critical" for a in generated_alerts):
        weather_risk_level = "Critical"
        weather_points = 90
    elif any(a["severity"] == "High" for a in generated_alerts):
        weather_risk_level = "High"
        weather_points = 70
    elif any(a["severity"] == "Medium" for a in generated_alerts):
        weather_risk_level = "Medium"
        weather_points = 40

    # B. Water Risk
    water_risk_level = "Low"
    water_points = 10
    if dry_spell_risk == "High":
        water_risk_level = "High"
        water_points = 80
    elif dry_spell_risk == "Medium":
        water_risk_level = "Medium"
        water_points = 50
        
    if farmer.irrigation_method == "Rainfed" and farmer.groundwater_depth > 12.0:
        # Increase water risk for rainfed farming in deep water table areas
        if water_risk_level == "Low":
            water_risk_level = "Medium"
            water_points = 45
        elif water_risk_level == "Medium":
            water_risk_level = "High"
            water_points = 75

    # C. Disease Risk
    # Check open cases
    expert_cases = db.query(models.DiagnosisCase)\
        .filter(models.DiagnosisCase.farmer_id == farmer.farmer_id)\
        .all()
    open_cases = [c for c in expert_cases if c.status in ["pending", "in_progress"]]
    
    disease_risk_level = "Low"
    disease_points = 10
    if len(open_cases) > 0:
        disease_risk_level = "High"
        disease_points = 85
    elif humidity > 80.0:
        # Fungal diseases thrive in humidity
        disease_risk_level = "Medium"
        disease_points = 45

    # D. Overall Farm Risk Score
    overall_score = (weather_points * 0.4) + (water_points * 0.3) + (disease_points * 0.3)
    overall_score = min(round(overall_score, 1), 100.0)

    # Compile dynamic stats
    crops = [c.strip() for c in farmer.crop_history.split(",") if c.strip()]
    current_crop = crops[0] if crops else "No active crop recorded"

    return {
        "profile": {
            "farmer_id": farmer.farmer_id,
            "name": farmer.name,
            "mobile": farmer.mobile,
            "location": f"{farmer.village}, {farmer.district}, {farmer.state}",
            "preferred_lang": farmer.preferred_lang
        },
        "farm_summary": {
            "land_size": farmer.land_size,
            "soil_type": farmer.soil_type,
            "soil_ph": farmer.soil_ph,
            "irrigation_method": farmer.irrigation_method,
            "groundwater_depth": farmer.groundwater_depth,
            "crop_history": farmer.crop_history
        },
        "active_crop": current_crop,
        "weather_summary": {
            "temperature": temp,
            "humidity": humidity,
            "rain_probability": rain_prob,
            "wind_speed": wind_speed,
            "dry_spell_risk": dry_spell_risk
        },
        # High fidelity Alert format for animated Alert Center on dashboard
        "alerts_center": [
            {
                "type": a["type"],
                "severity": a["severity"],
                "message": a["message"],
                "recommendation": a["recommendation"]
            }
            for a in generated_alerts
        ],
        "risk_breakdown": {
            "overall_score": overall_score,
            "weather_risk": weather_risk_level,
            "water_risk": water_risk_level,
            "disease_risk": disease_risk_level
        },
        "recent_alerts": [
            {"id": a.id, "type": a.type, "message": a.message, "sent_at": a.sent_at}
            for a in recent_alerts
        ],
        "cases_summary": {
            "open": len(open_cases),
            "resolved": len([c for c in expert_cases if c.status == "resolved"]),
            "history": [
                {
                    "case_id": c.case_id,
                    "disease_name": c.disease_name,
                    "confidence": c.confidence,
                    "status": c.status,
                    "priority": c.priority,
                    "created_at": c.created_at
                }
                for c in expert_cases[:5]
              ]
        }
    }
