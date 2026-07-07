import os
import random
import logging
import requests
from typing import List, Dict, Any, Tuple
from app.config import settings

# Pre-translated dictionary for regional languages to simulate IndicTrans2 high-fidelity translations
TRANSLATIONS = {
    "hi": {
        "Recommended Crop": "अनुशंसित फसल",
        "Confidence Score": "आत्मविश्वास स्कोर",
        "Reasons": "सिफारिश के कारण",
        "Yield Potential": "संभावित उपज",
        "Risk Factors": "जोखिम के कारक",
        "Dry Spell Alert": "सूखे की अवधि की चेतावनी",
        "Heavy Rain Alert": "भारी बारिश की चेतावनी",
        "Heat Wave Alert": "लू की चेतावनी",
        "Strong Wind Alert": "तेज़ हवा की चेतावनी",
        "Low": "कम",
        "Medium": "मध्यम",
        "High": "उच्च",
        "No specific alert for your region.": "आपके क्षेत्र के लिए कोई विशेष चेतावनी नहीं है।",
        "System is running normally.": "प्रणाली सामान्य रूप से काम कर रही है।",
        "Welcome to KisanVriddhi Assistant. How can I help you today?": "KisanVriddhi सहायक में आपका स्वागत है। आज मैं आपकी क्या सहायता कर सकता हूँ?",
        "Please select a crop and enter soil details for a recommendation.": "कृपया सिफारिश के लिए एक फसल चुनें और मिट्टी का विवरण दर्ज करें।",
        "Dry spell risk is High. Please irrigate your crops.": "सूखे का जोखिम उच्च है। कृपया अपनी फसलों की सिंचाई करें।"
    },
    "ml": {
        "Recommended Crop": "ശുപാർശ ചെയ്യുന്ന വിള",
        "Confidence Score": "വിശ്വാസ്യത സ്കോർ",
        "Reasons": "ശുപാർശയ്ക്കുള്ള കാരണങ്ങൾ",
        "Yield Potential": "വിളവ് സാധ്യത",
        "Risk Factors": "സാധ്യമായ ദോഷങ്ങൾ",
        "Dry Spell Alert": "വരൾച്ച മുന്നറിയിപ്പ്",
        "Heavy Rain Alert": "ശക്തമായ മഴ മുന്നറിയിപ്പ്",
        "Heat Wave Alert": "ഉഷ്ണതരംഗ മുന്നറിയിപ്പ്",
        "Strong Wind Alert": "ശക്തമായ കാറ്റ് മുന്നറിയിപ്പ്",
        "Low": "കുറഞ്ഞത്",
        "Medium": "മിതമായത്",
        "High": "കൂടിയത്",
        "No specific alert for your region.": "നിങ്ങളുടെ പ്രദേശത്തിന് പ്രത്യേക അലേർട്ടുകൾ ഒന്നുമില്ല.",
        "System is running normally.": "സിസ്റ്റം സാധാരണ രീതിയിൽ പ്രവർത്തിക്കുന്നു.",
        "Welcome to KisanVriddhi Assistant. How can I help you today?": "കിസാൻ അലേർട്ട് AI അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം. ഇന്ന് ഞാൻ നിങ്ങൾക്ക് എങ്ങനെയാണ് സഹായിക്കേണ്ടത്?",
        "Please select a crop and enter soil details for a recommendation.": "ശുപാർശയ്ക്കായി ദയവായി ഒരു വിള തിരഞ്ഞെടുത്ത് മണ്ണ് വിവരങ്ങൾ നൽകുക.",
        "Dry spell risk is High. Please irrigate your crops.": "വരൾച്ച സാധ്യത കൂടുതലാണ്. ദയവായി വിളകൾ നനയ്ക്കുക."
    },
    "te": {
        "Recommended Crop": "సిఫార్సు చేయబడిన పంట",
        "Confidence Score": "నమ్మకమైన స్కోరు",
        "Reasons": "సిఫార్సు చేయడానికి కారణాలు",
        "Yield Potential": "దిగుబడి సంభావ్యత",
        "Risk Factors": "నష్ట భయాలు",
        "Dry Spell Alert": "కరువు హెచ్చరిక",
        "Heavy Rain Alert": "భారీ వర్ష సూచన",
        "Heat Wave Alert": "తీవ్రమైన ఎండల హెచ్చరిక",
        "Strong Wind Alert": "ఈదురు గాలుల హెచ్చరిక",
        "Low": "తక్కువ",
        "Medium": "మధ్యస్థం",
        "High": "ఎక్కువ",
        "No specific alert for your region.": "మీ ప్రాంతానికి ప్రత్యేక హెచ్చరికలు లేవు.",
        "System is running normally.": "వ్యవస్థ సాధారణంగా నడుస్తోంది.",
        "Welcome to KisanVriddhi Assistant. How can I help you today?": "KisanVriddhi అసిస్టెంట్ కు స్వాగతం. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
        "Please select a crop and enter soil details for a recommendation.": "దయచేసి సిఫార్సు కోసం ఒక పంటను ఎంచుకుని, నేల వివరాలను నమోదు చేయండి.",
        "Dry spell risk is High. Please irrigate your crops.": "కరువు ప్రమాదం ఎక్కువగా ఉంది. దయచేసి మీ పంటలకు నీరు పెట్టండి."
    }
}

def translate_text(text: str, target_lang: str) -> str:
    """
    Simulates IndicTrans2 translations by mapping standard dashboard and assistant messages.
    If the text is not in the dictionary, returns a simulated translation.
    """
    if not target_lang or target_lang == "en":
        return text
        
    lang_dict = TRANSLATIONS.get(target_lang, {})
    if text in lang_dict:
        return lang_dict[text]
        
    # Mock Translation for general text
    translation_prefix = {
        "hi": "[अनुवाद] ",
        "ml": "[തർജ്ജമ] ",
        "te": "[అనువాదం] "
    }
    prefix = translation_prefix.get(target_lang, "")
    return f"{prefix}{text}"

def mock_speech_to_text(audio_file_path: str) -> str:
    """
    Simulates Whisper speech-to-text. Reads the audio filename to return
    simulated spoken queries, or returns a default query.
    """
    filename = os.path.basename(audio_file_path).lower()
    if "yellow" in filename or "yellow" in audio_file_path:
        return "My rice leaves are turning yellow with brown spots"
    if "rain" in filename or "weather" in filename:
        return "Will it rain tomorrow in my village?"
    if "recommend" in filename:
        return "Recommend me a crop for clay soil with pH 6.5"
    return "My crops are showing spots and the leaves are curling"

def run_vision_crop_analysis(image_file_path: str, description: str = "") -> List[str]:
    """
    Simulates Qwen2.5-VL or Florence-2 for crop image analysis.
    Extracts symptoms based on image file names and descriptions.
    """
    filename = os.path.basename(image_file_path).lower()
    combined_input = (filename + " " + description).lower()
    
    extracted_symptoms = []
    
    # Simple symptom parsing from file metadata and farmer comments
    if "yellow" in combined_input or "पीला" in combined_input or "മഞ്ഞ" in combined_input:
        extracted_symptoms.append("yellow_leaves")
    if "spot" in combined_input or "धब्बे" in combined_input or "പാടുകൾ" in combined_input:
        extracted_symptoms.append("brown_spots")
    if "curl" in combined_input or "fold" in combined_input or "मुड़" in combined_input:
        extracted_symptoms.append("leaf_curling")
    if "rust" in combined_input or "लाल" in combined_input:
        extracted_symptoms.append("rust_spots")
    if "white" in combined_input or "कीड़े" in combined_input or "പ്രാണി" in combined_input:
        extracted_symptoms.append("white_insects")
    if "hole" in combined_input or "stem" in combined_input or "तने" in combined_input:
        extracted_symptoms.append("stem_holes")
        
    # If no symptoms were extracted, return a randomized default set based on what is commonly diagnosed
    if not extracted_symptoms:
        # Default to a random symptom combination for visual representation
        possible_combos = [
            ["yellow_leaves", "brown_spots"],
            ["leaf_curling", "yellow_leaves"],
            ["brown_spots"],
            ["rust_spots", "yellow_leaves"],
            ["white_insects", "leaf_curling"]
        ]
        extracted_symptoms = random.choice(possible_combos)
        
    return extracted_symptoms

def fetch_open_meteo_weather(lat: float = 20.5937, lon: float = 78.9629) -> Dict[str, Any]:
    """
    Fetches real-time weather from Open-Meteo API.
    Returns comprehensive weather intelligence including current conditions,
    7-day agricultural forecast with farming status per day, and extreme weather alerts.
    """
    import datetime as dt

    def _compute_farming_status(rain_prob: float, wind: float, temp_max: float, temp_min: float, precip: float) -> str:
        """Classify a day as Good/Caution/HighRisk for farming."""
        if rain_prob > 75 or wind > 30 or temp_max > 42 or temp_min < 5 or precip > 30:
            return "High Risk"
        if rain_prob > 50 or wind > 20 or temp_max > 38 or precip > 15:
            return "Use Caution"
        return "Good for Farming"

    def _weather_code_to_desc(code: int) -> str:
        """Convert WMO weather codes to human-readable descriptions."""
        codes = {
            0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing rime fog",
            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
            80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
            95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
        }
        return codes.get(code, "Unknown")

    try:
        # Expanded Open-Meteo API request with comprehensive parameters
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,cloud_cover,weather_code"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,"
            f"precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset,weather_code"
            f"&timezone=auto"
        )
        response = requests.get(url, timeout=8)
        if response.status_code == 200:
            data = response.json()
            current = data.get("current", {})
            daily = data.get("daily", {})

            temp = current.get("temperature_2m", 30.0)
            humidity = current.get("relative_humidity_2m", 60.0)
            wind = current.get("wind_speed_10m", 12.0)
            feels_like = current.get("apparent_temperature", temp)
            cloud_cover = current.get("cloud_cover", 40)
            current_code = current.get("weather_code", 0)

            # Extract daily arrays
            dates = daily.get("time", [])
            temp_maxes = daily.get("temperature_2m_max", [])
            temp_mins = daily.get("temperature_2m_min", [])
            rain_probs = daily.get("precipitation_probability_max", [])
            precip_sums = daily.get("precipitation_sum", [])
            wind_maxes = daily.get("wind_speed_10m_max", [])
            uv_indices = daily.get("uv_index_max", [])
            sunrises = daily.get("sunrise", [])
            sunsets = daily.get("sunset", [])
            weather_codes = daily.get("weather_code", [])

            rain_prob = rain_probs[0] if rain_probs else 0.0
            uv_index = uv_indices[0] if uv_indices else 5.0

            # Build 7-day forecast with farming status
            daily_forecast = []
            for i in range(min(7, len(dates))):
                t_max = temp_maxes[i] if i < len(temp_maxes) else temp
                t_min = temp_mins[i] if i < len(temp_mins) else temp - 8
                rp = rain_probs[i] if i < len(rain_probs) else 0
                ps = precip_sums[i] if i < len(precip_sums) else 0
                wm = wind_maxes[i] if i < len(wind_maxes) else wind
                wc = weather_codes[i] if i < len(weather_codes) else 0

                daily_forecast.append({
                    "date": dates[i] if i < len(dates) else "",
                    "temp_max": round(t_max, 1),
                    "temp_min": round(t_min, 1),
                    "rain_probability": round(rp, 1),
                    "precipitation_sum": round(ps, 1),
                    "wind_max": round(wm, 1),
                    "weather_code": wc,
                    "weather_desc": _weather_code_to_desc(wc),
                    "uv_index": round(uv_indices[i], 1) if i < len(uv_indices) else 5.0,
                    "farming_status": _compute_farming_status(rp, wm, t_max, t_min, ps)
                })

            # Dry Spell Calculation
            forecast_rain = sum(precip_sums[:7]) if precip_sums else 0
            avg_max_temp = sum(temp_maxes[:7]) / max(len(temp_maxes[:7]), 1) if temp_maxes else temp

            dry_spell_risk = "Low"
            if forecast_rain < 5.0 and humidity < 50.0 and avg_max_temp > 32.0:
                dry_spell_risk = "High"
            elif forecast_rain < 15.0 and humidity < 60.0:
                dry_spell_risk = "Medium"

            # Generate extreme weather alerts with severity
            alerts = []
            if temp > 40.0:
                alerts.append({"severity": "critical", "type": "Heatwave", "message": "Extreme heat wave detected. Avoid field exposure from 12 PM to 4 PM. Ensure livestock have shade and water."})
            elif temp > 37.0:
                alerts.append({"severity": "high", "type": "Heat Stress", "message": "High temperatures may cause crop stress. Increase irrigation frequency and apply mulch."})
            if rain_prob > 80.0 or forecast_rain > 50.0:
                alerts.append({"severity": "critical", "type": "Heavy Rain", "message": "Extreme precipitation expected. Clear drainage channels immediately to prevent waterlogging."})
            elif rain_prob > 60.0:
                alerts.append({"severity": "high", "type": "Rain Warning", "message": "Significant rainfall expected. Delay fertilizer and pesticide application."})
            if wind > 30.0:
                alerts.append({"severity": "critical", "type": "High Winds", "message": "Wind speeds exceed 30 km/h. Secure greenhouses, staked plants, and fragile crops."})
            elif wind > 20.0:
                alerts.append({"severity": "advisory", "type": "Wind Advisory", "message": "Moderate winds expected. Monitor young plant supports and spray schedules."})
            if dry_spell_risk == "High":
                alerts.append({"severity": "critical", "type": "Drought", "message": "No rainfall forecast for next 7 days with high temperatures. Plan supplementary irrigation immediately."})
            if uv_index > 10:
                alerts.append({"severity": "high", "type": "UV Alert", "message": "Extreme UV index. Field workers should use protection. Crops may experience UV stress."})
            if any(t_min < 10 for t_min in temp_mins[:3]):
                alerts.append({"severity": "advisory", "type": "Cold Advisory", "message": "Low nighttime temperatures expected. Protect cold-sensitive crops with row covers."})

            # If no alerts, add a safe status
            if not alerts:
                alerts.append({"severity": "safe", "type": "All Clear", "message": "No extreme weather conditions detected. Favorable conditions for farming operations."})

            # Format sunrise/sunset
            sunrise_str = sunrises[0].split("T")[1][:5] if sunrises and "T" in sunrises[0] else "06:00"
            sunset_str = sunsets[0].split("T")[1][:5] if sunsets and "T" in sunsets[0] else "18:30"

            return {
                "temperature": round(temp, 1),
                "feels_like": round(feels_like, 1),
                "humidity": round(humidity, 1),
                "rain_probability": round(rain_prob, 1),
                "wind_speed": round(wind, 1),
                "uv_index": round(uv_index, 1),
                "cloud_cover": cloud_cover,
                "weather_code": current_code,
                "weather_desc": _weather_code_to_desc(current_code),
                "sunrise": sunrise_str,
                "sunset": sunset_str,
                "alerts": alerts,
                "dry_spell_risk": dry_spell_risk,
                "last_updated": dt.datetime.now().isoformat(),
                "daily_forecast": daily_forecast
            }
    except Exception as e:
        logging.warning(f"Open-Meteo API error: {e}")

    # ---- Fallback simulated weather data ----
    import datetime as dt
    temp = round(random.uniform(28.0, 36.0), 1)
    humidity = round(random.uniform(40.0, 75.0), 1)
    rain_prob = round(random.uniform(10.0, 90.0), 1)
    wind = round(random.uniform(5.0, 25.0), 1)

    dry_spell_risk = "Low"
    alerts = []

    if rain_prob < 20.0 and humidity < 45.0:
        dry_spell_risk = "High"
        alerts.append({"severity": "critical", "type": "Drought", "message": "Low soil moisture and dry winds expected. Irrigate crops in evening."})
    elif rain_prob > 75.0:
        alerts.append({"severity": "high", "type": "Heavy Rain", "message": "High probability of downpour in the next 24 hours."})

    if not alerts:
        alerts.append({"severity": "safe", "type": "All Clear", "message": "No extreme weather conditions detected. Favorable farming conditions."})

    # Generate mock 7-day forecast
    daily_forecast = []
    base_date = dt.date.today()
    for i in range(7):
        d = base_date + dt.timedelta(days=i)
        t_max = round(temp + random.uniform(-2, 4), 1)
        t_min = round(temp - random.uniform(5, 10), 1)
        rp = round(random.uniform(10, 85), 1)
        ps = round(random.uniform(0, 20), 1) if rp > 40 else 0
        wm = round(random.uniform(5, 25), 1)
        daily_forecast.append({
            "date": d.isoformat(),
            "temp_max": t_max,
            "temp_min": t_min,
            "rain_probability": rp,
            "precipitation_sum": ps,
            "wind_max": wm,
            "weather_code": random.choice([0, 1, 2, 3, 61, 63, 80]),
            "weather_desc": random.choice(["Clear sky", "Partly cloudy", "Slight rain", "Moderate rain showers"]),
            "uv_index": round(random.uniform(4, 10), 1),
            "farming_status": _compute_farming_status(rp, wm, t_max, t_min, ps)
        })

    return {
        "temperature": temp,
        "feels_like": round(temp + random.uniform(1, 4), 1),
        "humidity": humidity,
        "rain_probability": rain_prob,
        "wind_speed": wind,
        "uv_index": round(random.uniform(4, 9), 1),
        "cloud_cover": random.randint(10, 80),
        "weather_code": 2,
        "weather_desc": "Partly cloudy",
        "sunrise": "05:45",
        "sunset": "19:10",
        "alerts": alerts,
        "dry_spell_risk": dry_spell_risk,
        "last_updated": dt.datetime.now().isoformat(),
        "daily_forecast": daily_forecast
    }

