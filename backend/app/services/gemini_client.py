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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
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

def generate_advisory_response(farmer, weather, crop_history, expert_kb, query_str) -> dict:
    """Generate structured advisory using Gemini 2.5 Flash / 1.5 Flash."""
    prompt = f"""You are the agricultural advisory engine 'KisanVriddhi'.
Analyze the farmer query and contextual agricultural data.

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
  "recommendation": "Main advisory response in user's language (concise, max 3 sentences)",
  "why": "Brief explanation of why this was recommended in user's language",
  "potential_risks": ["Risk 1 in user's language", "Risk 2 in user's language"],
  "expected_benefits": ["Benefit 1 in user's language", "Benefit 2 in user's language"],
  "advisory_strength": "High", // Can be "High", "Medium", or "Low" based on evidence quality
  "evidence_sources": ["Weather Forecast", "Farmer Profile", "Expert Knowledge Base"], // List elements used
  "action_plan": [
    {{"day": 1, "action": "Day 1 task details in user's language"}},
    {{"day": 2, "action": "Day 2 task details in user's language"}},
    {{"day": 3, "action": "Day 3 task details in user's language"}},
    {{"day": 5, "action": "Day 5 task details in user's language"}},
    {{"day": 7, "action": "Day 7 task details in user's language"}}
  ]
}}
Ensure the entire text fields are translated to the farmer's preferred language (code: {farmer.preferred_lang}).
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
