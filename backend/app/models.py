import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False) # For farmers, it's their mobile; for officers, it's their username/email
    password_hash = Column(String, nullable=False)
    role = Column(String, default="farmer") # "farmer" or "officer"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False)

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    farmer_id = Column(String, unique=True, index=True, nullable=False) # e.g. KA-2026-000001
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, default="")
    village = Column(String, nullable=False)
    preferred_lang = Column(String, default="en") # "en", "hi", "ml", "te"

    # Digital Farm Profile fields
    land_size = Column(Float, default=0.0) # in acres
    soil_type = Column(String, default="Alluvial")
    soil_ph = Column(Float, default=7.0)
    irrigation_method = Column(String, default="Rainfed")
    groundwater_depth = Column(Float, default=0.0) # in meters
    crop_history = Column(String, default="") # comma separated list or json of crops

    # Relationships
    user = relationship("User", back_populates="farmer_profile")

class CropHealthLog(Base):
    __tablename__ = "crop_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String, nullable=False, index=True)
    description = Column(String, default="")
    image_path = Column(String, nullable=True)
    voice_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DiagnosisCase(Base):
    __tablename__ = "diagnosis_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True, nullable=False) # e.g. CASE-2026-000001
    farmer_id = Column(String, ForeignKey("farmer_profiles.farmer_id"), nullable=False)
    disease_name = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    symptoms = Column(String, default="") # Comma separated list of symptoms
    treatment = Column(String, default="")
    status = Column(String, default="pending") # "pending", "in_progress", "resolved"
    priority = Column(String, default="Medium") # "Low", "Medium", "High", "Critical"
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    officer_remarks = Column(String, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AlertHistory(Base):
    __tablename__ = "alert_histories"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False) # "Dry Spell", "Heavy Rain", "Heat Wave", "Strong Wind", "Disease Risk"
    message = Column(String, nullable=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False) # "user", "assistant"
    content = Column(String, nullable=False)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FarmerMessage(Base):
    """Direct messages from farmers to officers — triggered from the chat 'Contact Officer' flow."""
    __tablename__ = "farmer_messages"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmer_profiles.farmer_id"), nullable=False, index=True)
    farmer_name = Column(String, nullable=False)
    message = Column(String, nullable=False)           # farmer's question/problem
    language = Column(String, default="en")
    status = Column(String, default="open")            # "open", "replied", "closed"
    officer_reply = Column(String, nullable=True)      # officer's reply text
    replied_by = Column(String, nullable=True)         # officer username
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    replied_at = Column(DateTime, nullable=True)

