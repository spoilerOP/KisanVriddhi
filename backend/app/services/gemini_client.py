import os
import base64
import json
import logging
import requests
from app.config import settings

def call_gemini_api(prompt: str, image_data: dict = None) -> dict:
    """Helper function to make direct HTTP requests to the Gemini 1.5 Flash API."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logging.warning("GEMINI_API_KEY is not configured in environment.")
        return {}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    parts = []
    if image_data:
        parts.append({
            "inlineData": {
                "mimeType": image_data.get("mime_type", "image/jpeg"),
                "data": image_data.get("base64_data")
            }
        })
    parts.append({"text": prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        resp_json = response.json()
        
        candidates = resp_json.get("candidates", [])
        if not candidates:
            logging.error(f"Gemini API returned no candidates. Full response: {resp_json}")
            return {}
            
        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return json.loads(text_content.strip())
    except Exception as e:
        logging.error(f"Gemini API call failed: {e}")
        return {}

def generate_advisory_response(farmer, weather, crop_history, expert_kb, query_str, language: str = None) -> dict:
    """Generate structured advisory using Gemini 2.0 Flash."""
    selected_lang = language or farmer.preferred_lang or "en"
    
    LANGUAGE_MAP = {
        "en": "English",
        "hi": "Hindi",
        "ml": "Malayalam",
        "te": "Telugu"
    }
    lang_name = LANGUAGE_MAP.get(selected_lang, "English")

    lang_rules = f"""IMPORTANT RULES:
1. Reply ONLY in {lang_name}.
2. Never switch to English under any circumstances.
3. Use simple farmer-friendly {lang_name}.
4. Use agricultural terminology commonly understood by farmers speaking {lang_name}.
5. Keep the response concise, structured, and actionable.
6. The entire text fields in the returned JSON object MUST be translated to {lang_name}."""

    prompt = f"""You are the agricultural advisory engine 'KisanVriddhi'.
Analyze the farmer query and contextual agricultural data.

{lang_rules}

Farmer Context:
- Name: {farmer.name}
- State/District/Village: {farmer.state} / {farmer.district} / {farmer.village}
- Soil: {farmer.soil_type}, pH {farmer.soil_ph}
- Irrigation: {farmer.irrigation_method}
- Groundwater: {farmer.groundwater_depth}m
- Crop history: {farmer.crop_history}

Weather Context:
- Temp: {weather.get("temperature", 30.0)}°C
- Humidity: {weather.get("humidity", 60.0)}%
- Rain probability: {weather.get("rain_probability", 40.0)}%
- Alerts: {weather.get("alerts", [])}

Expert Q&A Knowledge Base matches:
{expert_kb}

User Query:
{query_str}

Please generate a JSON object matching this schema EXACTLY:
{{
  "recommendation": "Main advisory response (concise, max 3 sentences)",
  "why": "Brief explanation of why this was recommended",
  "potential_risks": ["Risk 1", "Risk 2"],
  "expected_benefits": ["Benefit 1", "Benefit 2"],
  "advisory_strength": "High", // Can be "High", "Medium", or "Low" based on evidence quality
  "evidence_sources": ["Weather Forecast", "Farmer Profile", "Expert Knowledge Base"], // List elements used
  "action_plan": [
    {{"day": 1, "action": "Day 1 task details"}},
    {{"day": 2, "action": "Day 2 task details"}},
    {{"day": 3, "action": "Day 3 task details"}},
    {{"day": 5, "action": "Day 5 task details"}},
    {{"day": 7, "action": "Day 7 task details"}}
  ]
}}
"""
    return call_gemini_api(prompt)

def generate_vision_disease_analysis(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """Analyze crop leaf image using Gemini Vision."""
    base64_data = base64.b64encode(image_bytes).decode("utf-8")
    
    prompt = """Analyze this crop leaf photo. Determine if there is a crop disease.
Please generate a JSON object matching this schema EXACTLY:
{
  "ai_disease_name": "Disease Name (e.g. Rice Blast)",
  "severity": "Low", // "Low", "Medium", "High", or "Critical"
  "confidence_level": "High", // "High", "Medium", or "Low"
  "ai_treatment": "Detail immediate treatment recommendations (e.g. chemical names, dosages)",
  "ai_reasoning": "Reasoning explaining why this disease was identified and visible leaf spot markers",
  "escalate_to_officer": true // true if severity is High/Critical or confidence is Low
}
"""
    return call_gemini_api(prompt, image_data={"mime_type": mime_type, "base64_data": base64_data})

def generate_officer_district_intelligence(cases_summary: list, weather_summary: list) -> dict:
    """Generate district intelligence copilot summary for agricultural officers."""
    prompt = f"""You are the District Intelligence Copilot for agricultural officers.
Given the following data:

Recent Diagnosis Cases:
{json.dumps(cases_summary)}

Active Weather Alerts:
{json.dumps(weather_summary)}

Please generate a JSON object matching this schema EXACTLY:
{{
  "daily_summary": "Brief 2-3 sentence summary overview of the current district agricultural health.",
  "top_risk_districts": ["District Name - Reason"],
  "disease_hotspots": ["Crop Disease - Location name"],
  "weather_impact_analysis": "Summary of active risks such as heatwaves or heavy rains.",
  "recommended_government_actions": ["Specific action line 1", "Specific action line 2"],
  "farmer_outreach_priority": ["Farmer Name (ID) - Mobile - Critical alert reason"]
}}
"""
    return call_gemini_api(prompt)
