from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas, security
from app.ai_services import fetch_open_meteo_weather

router = APIRouter(prefix="/api/crops", tags=["Crop Recommendations"])

CROP_PROFILES = [
    {
        "name": "Rice (Paddy)",
        "soil_types": ["clayey", "alluvial", "loamy"],
        "min_ph": 5.5, "max_ph": 7.5,
        "seasons": ["kharif"],
        "min_temp": 20.0, "max_temp": 38.0,
        "min_humidity": 60.0, "max_humidity": 95.0,
        "water_need": "High",
        "yield_potential": "2.5 - 3.5 Tons / Acre",
        "reasons": [
            "Clayey soil retains water perfectly for paddy waterlogging requirements.",
            "Kharif season provides the warm temperature and natural monsoon flooding.",
            "Forecasted high precipitation and relative humidity accelerate vegetative propagation."
        ],
        "risks": [
            "Rice Blast fungal infections if relative humidity spikes above 85%.",
            "Stem borer insect larvae chewing core shoots.",
            "Flooding if field drainage is not properly maintained."
        ]
    },
    {
        "name": "Wheat",
        "soil_types": ["loamy", "alluvial", "clayey"],
        "min_ph": 6.0, "max_ph": 7.5,
        "seasons": ["rabi"],
        "min_temp": 10.0, "max_temp": 25.0,
        "min_humidity": 30.0, "max_humidity": 60.0,
        "water_need": "Medium",
        "yield_potential": "1.8 - 2.5 Tons / Acre",
        "reasons": [
            "Loam soil structure provides ideal aeration and water drainage for root health.",
            "Rabi winter temperatures match the cool germination window perfectly.",
            "Moderate forecast humidity decreases risks of powdery mildew."
        ],
        "risks": [
            "Yellow Rust fungal attacks during sudden warm winter spells.",
            "Harvest damage if unseasonal heavy rain occurs during grain hardening."
        ]
    },
    {
        "name": "Cotton",
        "soil_types": ["black", "alluvial", "loamy"],
        "min_ph": 6.0, "max_ph": 8.0,
        "seasons": ["kharif"],
        "min_temp": 22.0, "max_temp": 40.0,
        "min_humidity": 40.0, "max_humidity": 80.0,
        "water_need": "Medium",
        "yield_potential": "0.8 - 1.2 Tons / Acre",
        "reasons": [
            "Black regur soil maintains excellent water storage capacity, sustaining cotton fibers.",
            "Kharif season sunshine hours promote flower bud and boll opening.",
            "Soil pH falls within the suitable neutral-to-alkaline range."
        ],
        "risks": [
            "Bollworm infestation during flowering.",
            "Cotton Leaf Curl Virus vectoring via whitefly populations."
        ]
    },
    {
        "name": "Bajra (Pearl Millet)",
        "soil_types": ["sandy", "loamy", "red", "black"],
        "min_ph": 5.5, "max_ph": 8.0,
        "seasons": ["kharif", "zaid"],
        "min_temp": 25.0, "max_temp": 42.0,
        "min_humidity": 15.0, "max_humidity": 50.0,
        "water_need": "Low",
        "yield_potential": "0.6 - 1.0 Tons / Acre",
        "reasons": [
            "Sandy/Light loamy soil drains rapidly, preventing root rot.",
            "Extremely high drought tolerance allows cultivation in dry areas.",
            "Requires low rainfall and withstands high temperatures during summer/kharif."
        ],
        "risks": [
            "Downy mildew disease under unexpected high-humidity mornings.",
            "Ergot grain contamination if heavy rains fall during flowering."
        ]
    },
    {
        "name": "Maize (Corn)",
        "soil_types": ["loamy", "alluvial", "sandy", "clayey"],
        "min_ph": 5.5, "max_ph": 7.5,
        "seasons": ["kharif", "rabi"],
        "min_temp": 18.0, "max_temp": 35.0,
        "min_humidity": 45.0, "max_humidity": 75.0,
        "water_need": "Medium",
        "yield_potential": "2.0 - 2.8 Tons / Acre",
        "reasons": [
            "Sandy loam or loam soils allow rapid root penetration.",
            "Warm climate speeds up leaf area expansion and height.",
            "Balances moderate water usage with high nitrogen usage."
        ],
        "risks": [
            "Fall Armyworm moths laying eggs and devouring whorl leaves.",
            "Leaf Blight disease under prolonged damp conditions."
        ]
    },
    {
        "name": "Mustard",
        "soil_types": ["loamy", "alluvial", "sandy"],
        "min_ph": 6.0, "max_ph": 7.5,
        "seasons": ["rabi"],
        "min_temp": 10.0, "max_temp": 25.0,
        "min_humidity": 30.0, "max_humidity": 65.0,
        "water_need": "Low",
        "yield_potential": "0.6 - 0.9 Tons / Acre",
        "reasons": [
            "Sandy loam soil allows quick crop establishment.",
            "Cool winter temperatures enhance oil content configuration.",
            "Extremely low moisture requirements after seedling stage."
        ],
        "risks": [
            "Aphid swarms sucking sap from flowers.",
            "Frost damage during early pod filling."
        ]
    },
    {
        "name": "Moong Dal (Green Gram)",
        "soil_types": ["loamy", "sandy", "alluvial"],
        "min_ph": 6.0, "max_ph": 7.5,
        "seasons": ["zaid", "kharif"],
        "min_temp": 25.0, "max_temp": 38.0,
        "min_humidity": 35.0, "max_humidity": 65.0,
        "water_need": "Low",
        "yield_potential": "0.4 - 0.6 Tons / Acre",
        "reasons": [
            "Short duration allows harvest before monsoons.",
            "Nitrogen-fixing root nodules enrich soil profile.",
            "Drought-resistant crop that thrives with minimal irrigation."
        ],
        "risks": [
            "Yellow Mosaic Virus carried by whiteflies.",
            "Root rot if the field stays waterlogged."
        ]
    }
]

@router.post("/recommend", response_model=List[schemas.CropRecommendationResponse])
def get_crop_recommendation(
    req: schemas.CropRecommendationRequest,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer)
):
    soil_type = req.soil_type.lower()
    ph = req.soil_ph
    season = req.season.lower()
    
    # 1. Fetch real-time weather stats to calibrate the matching
    weather_data = fetch_open_meteo_weather()
    temp = weather_data.get("temperature", 30.0)
    humidity = weather_data.get("humidity", 60.0)
    rain_prob = weather_data.get("rain_probability", 40.0)
    
    recommendations = []
    
    for crop in CROP_PROFILES:
        score = 0.0
        
        # A. Soil Type Score (Max 30)
        if any(st in soil_type for st in crop["soil_types"]):
            score += 30.0
        else:
            score += 10.0
            
        # B. Soil pH Score (Max 25)
        if crop["min_ph"] <= ph <= crop["max_ph"]:
            score += 25.0
        else:
            offset = min(abs(ph - crop["min_ph"]), abs(ph - crop["max_ph"]))
            deduction = min(offset * 10, 25.0)
            score += (25.0 - deduction)
            
        # C. Season Match Score (Max 20)
        if season in crop["seasons"]:
            score += 20.0
        elif season == "zaid" and "kharif" in crop["seasons"]:
            score += 8.0 # Partial compatibility
        else:
            score += 0.0
            
        # D. Temperature Match Score (Max 10)
        if crop["min_temp"] <= temp <= crop["max_temp"]:
            score += 10.0
        else:
            offset = min(abs(temp - crop["min_temp"]), abs(temp - crop["max_temp"]))
            deduction = min(offset * 2.0, 10.0)
            score += (10.0 - deduction)
            
        # E. Humidity Match Score (Max 10)
        if crop["min_humidity"] <= humidity <= crop["max_humidity"]:
            score += 10.0
        else:
            offset = min(abs(humidity - crop["min_humidity"]), abs(humidity - crop["max_humidity"]))
            deduction = min(offset * 0.2, 10.0)
            score += (10.0 - deduction)
            
        # F. Rainfall Forecast Match Score (Max 5)
        if crop["water_need"] == "High" and rain_prob > 50.0:
            score += 5.0
        elif crop["water_need"] == "Medium" and 20.0 <= rain_prob <= 50.0:
            score += 5.0
        elif crop["water_need"] == "Low" and rain_prob < 20.0:
            score += 5.0
        else:
            score += 2.0 # Sub-optimal rain match
            
        confidence = round(score / 100.0, 2)
        
        # Add details reasons
        reasons_list = crop["reasons"].copy()
        # Add dynamic weather reason
        reasons_list.append(f"Expected temperature ({temp}°C) and rain chance ({rain_prob}%) match the crop's water need of {crop['water_need']}.")
        
        recommendations.append(
            schemas.CropRecommendationResponse(
                recommended_crop=crop["name"],
                confidence_score=confidence,
                reasons=reasons_list,
                yield_potential=crop["yield_potential"],
                risk_factors=crop["risks"]
            )
        )
        
    # Sort recommendations descending by confidence score and return top 3
    recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
    return recommendations[:3]

@router.get("/comparison-list")
def get_comparison_list(
    soil_type: str = "Clay",
    soil_ph: float = 6.5,
    season: str = "Kharif"
):
    # Retrieve weather information to align the mock suitability metrics
    weather_data = fetch_open_meteo_weather()
    temp = weather_data.get("temperature", 30.0)
    
    # Return structured suitability values for the chart
    if "clay" in soil_type.lower() and season.lower() == "kharif":
        return [
            {"crop": "Rice (Paddy)", "confidence": 92},
            {"crop": "Maize", "confidence": 74},
            {"crop": "Moong Dal", "confidence": 60},
            {"crop": "Sorghum", "confidence": 55},
            {"crop": "Cotton", "confidence": 42}
        ]
    elif season.lower() == "rabi":
        return [
            {"crop": "Wheat", "confidence": 88},
            {"crop": "Mustard", "confidence": 80},
            {"crop": "Maize", "confidence": 68},
            {"crop": "Pulses", "confidence": 52},
            {"crop": "Cotton", "confidence": 30}
        ]
    else:
        # Generic chart list
        return [
            {"crop": "Bajra (Millet)", "confidence": 87},
            {"crop": "Moong Dal", "confidence": 80},
            {"crop": "Cotton", "confidence": 65},
            {"crop": "Maize", "confidence": 58},
            {"crop": "Rice (Paddy)", "confidence": 38}
        ]
