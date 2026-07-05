from fastapi import APIRouter, Depends
from app import schemas, security, models
from app.ai_services import fetch_open_meteo_weather

router = APIRouter(prefix="/api/weather", tags=["Weather Intelligence"])

@router.get("/forecast", response_model=schemas.WeatherDetails)
def get_weather_forecast(
    lat: float = 20.5937,
    lon: float = 78.9629,
    farmer: models.FarmerProfile = Depends(security.get_current_farmer)
):
    weather_data = fetch_open_meteo_weather(lat, lon)
    return weather_data
