from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

# --- AUTH SCHEMAS ---

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username (mobile number for farmers)")
    password: str = Field(..., min_length=8, max_length=128, description="Strong password")
    role: str = Field("farmer", description="Role: farmer or officer")

    # Add field validation for role
    @field_validator("role")
    def validate_role(cls, v):
        if v not in ["farmer", "officer"]:
            raise ValueError("Role must be 'farmer' or 'officer'")
        return v

class UserLogin(BaseModel):
    username: str = Field(..., description="Username or mobile number")
    password: str = Field(..., description="Password")

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    farmer_id: Optional[str] = None
    name: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- FARMER SCHEMAS ---

class FarmerProfileCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., pattern=r"^\+?[0-9]{10,15}$", description="10-15 digit mobile number")
    state: str = Field(..., min_length=2, max_length=100)
    district: str = Field("", max_length=100)
    village: str = Field(..., min_length=2, max_length=100)
    preferred_lang: str = Field("en", description="Preferred Language code (en, hi, ml, te)")

    @field_validator("preferred_lang")
    def validate_lang(cls, v):
        if v not in ["en", "hi", "ml", "te"]:
            raise ValueError("Language must be one of: en, hi, ml, te")
        return v

class FarmerProfileUpdate(BaseModel):
    land_size: float = Field(..., ge=0.0)
    soil_type: str = Field(..., min_length=3, max_length=50)
    soil_ph: float = Field(..., ge=0.0, le=14.0)
    irrigation_method: str = Field(..., min_length=3, max_length=50)
    groundwater_depth: float = Field(..., ge=0.0)
    crop_history: str = Field("", max_length=500)

class FarmerProfileResponse(BaseModel):
    farmer_id: str
    name: str
    mobile: str
    state: str
    district: str
    village: str
    preferred_lang: str
    land_size: float
    soil_type: str
    soil_ph: float
    irrigation_method: str
    groundwater_depth: float
    crop_history: str

    class Config:
        from_attributes = True

# --- CROP RECOMMENDATION SCHEMAS ---

class CropRecommendationRequest(BaseModel):
    soil_type: str = Field(..., min_length=3, max_length=50)
    soil_ph: float = Field(..., ge=0.0, le=14.0)
    land_size: float = Field(..., ge=0.0)
    season: str = Field(..., min_length=3, max_length=50) # "Kharif", "Rabi", "Zaid"

class CropRecommendationResponse(BaseModel):
    recommended_crop: str
    confidence_score: float
    reasons: List[str]
    yield_potential: str
    risk_factors: List[str]

# --- WEATHER AND ADVISORY SCHEMAS ---

class WeatherDetails(BaseModel):
    temperature: float
    humidity: float
    rain_probability: float
    wind_speed: float
    alerts: List[str]
    dry_spell_risk: str # "Low", "Medium", "High"

# --- CROP HEALTH LOG & DISEASE DIAGNOSIS SCHEMAS ---

class CropHealthLogResponse(BaseModel):
    id: int
    farmer_id: str
    description: str
    image_path: Optional[str]
    voice_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DiseaseQuestionAnswer(BaseModel):
    question_key: str
    answer: bool # True (Yes), False (No)

class DiseaseDiagnosisRequest(BaseModel):
    description: str = Field("", max_length=1000)
    symptoms: List[str] = Field(default_factory=list)
    answers: List[DiseaseQuestionAnswer] = Field(default_factory=list)

class ExpertQuestion(BaseModel):
    key: str
    text_en: str
    text_hi: str
    text_ml: str
    text_te: str

class DiseaseDiagnosisResponse(BaseModel):
    disease_name: str
    confidence: float
    symptoms_detected: List[str]
    treatment_recommendation: str
    reasoning: str = ""
    referred_to_expert: bool
    case_id: Optional[str] = None
    follow_up_questions: List[ExpertQuestion] = Field(default_factory=list)

# --- CASE MANAGEMENT (OFFICER) SCHEMAS ---

class CaseStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|in_progress|resolved)$")

class CaseRemarkUpdate(BaseModel):
    remarks: str = Field(..., min_length=1, max_length=1000)

class DiagnosisCaseResponse(BaseModel):
    id: int
    case_id: str
    farmer_id: str
    disease_name: str
    confidence: float
    symptoms: str
    treatment: str
    status: str
    priority: str
    officer_remarks: str
    created_at: datetime
    farmer_name: Optional[str] = None
    farmer_mobile: Optional[str] = None

    class Config:
        from_attributes = True

# --- CHAT / AI KISAN ASSISTANT SCHEMAS ---

class ChatMessageInput(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    voice_base64: Optional[str] = None # For audio input simulation

class ChatMessageResponse(BaseModel):
    response: str
    voice_response_url: Optional[str] = None # For voice readout simulation
    translated_response: Optional[str] = None

# --- FARMER → OFFICER DIRECT MESSAGING SCHEMAS ---

class ContactOfficerInput(BaseModel):
    message: str = Field(..., min_length=5, max_length=2000, description="Farmer's problem description for officer")

class FarmerMessageResponse(BaseModel):
    id: int
    farmer_id: str
    farmer_name: str
    message: str
    language: str
    status: str
    officer_reply: Optional[str] = None
    replied_by: Optional[str] = None
    created_at: datetime
    replied_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OfficerReplyInput(BaseModel):
    reply: str = Field(..., min_length=2, max_length=2000, description="Officer's reply to the farmer")

