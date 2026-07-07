import logging
from sqlalchemy.orm import Session
from app import models, security

logger = logging.getLogger(__name__)

def preload_demo_records(db: Session):
    logger.info("Clearing tables and preloading demo data...")
    
    # 1. Clear Tables in reverse order of foreign keys
    db.query(models.ChatHistory).delete()
    db.query(models.AlertHistory).delete()
    db.query(models.DiagnosisCase).delete()
    db.query(models.CropHealthLog).delete()
    db.query(models.FarmerProfile).delete()
    db.query(models.User).delete()
    db.commit()

    # 2. Seed Users
    # Standard password hash for all demo users: 'demo1234'
    pass_hash = security.get_password_hash("demo1234")

    # Officers
    officer_amit = models.User(username="officer_amit", password_hash=pass_hash, role="officer")
    db.add(officer_amit)
    db.commit()
    db.refresh(officer_amit) # To get officer_amit.id

    # Farmers
    farmer_user_1 = models.User(username="9876500001", password_hash=pass_hash, role="farmer")
    farmer_user_2 = models.User(username="9876500002", password_hash=pass_hash, role="farmer")
    farmer_user_3 = models.User(username="9876500003", password_hash=pass_hash, role="farmer")
    db.add_all([farmer_user_1, farmer_user_2, farmer_user_3])
    db.commit()
    
    db.refresh(farmer_user_1)
    db.refresh(farmer_user_2)
    db.refresh(farmer_user_3)

    # 3. Seed Farmer Profiles
    profile_1 = models.FarmerProfile(
        user_id=farmer_user_1.id,
        farmer_id="KA-2026-000001",
        name="Baldev Singh (Healthy Farm)",
        mobile="9876500001",
        state="Punjab",
        district="Bhatinda",
        village="Haripur",
        preferred_lang="en",
        land_size=5.2,
        soil_type="Loamy",
        soil_ph=6.5,
        irrigation_method="Sprinkler",
        groundwater_depth=22.0,
        crop_history="Wheat, Maize, Mustard"
    )

    profile_2 = models.FarmerProfile(
        user_id=farmer_user_2.id,
        farmer_id="KA-2026-000002",
        name="Anji Reddy (Medium Risk)",
        mobile="9876500002",
        state="Andhra Pradesh",
        district="Guntur",
        village="Kaza",
        preferred_lang="te",
        land_size=3.8,
        soil_type="Black",
        soil_ph=7.6,
        irrigation_method="Drip Irrigation",
        groundwater_depth=15.5,
        crop_history="Cotton, Maize"
    )

    profile_3 = models.FarmerProfile(
        user_id=farmer_user_3.id,
        farmer_id="KA-2026-000003",
        name="Sreedharan Nair (Critical Risk)",
        mobile="9876500003",
        state="Kerala",
        district="Alappuzha",
        village="Kuttanad",
        preferred_lang="ml",
        land_size=2.0,
        soil_type="Clayey",
        soil_ph=5.8,
        irrigation_method="Flood Irrigation",
        groundwater_depth=1.2,
        crop_history="Rice (Paddy)"
    )
    
    db.add_all([profile_1, profile_2, profile_3])
    db.commit()

    # 4. Seed Weather Alerts
    alert_1 = models.AlertHistory(
        farmer_id="KA-2026-000001",
        type="Weather Clear",
        message="Optimal weather conditions in Haripur. Temperatures are forecast to be stable around 28°C."
    )
    alert_2 = models.AlertHistory(
        farmer_id="KA-2026-000002",
        type="Dry Spell",
        message="Dry Spell Warning: Zero precipitation is forecast for the next 7 days in Guntur. Adjust drip schedules."
    )
    alert_3 = models.AlertHistory(
        farmer_id="KA-2026-000003",
        type="Flood Warning",
        message="CRITICAL Flood Alert: Outflow and rain exceed 150mm expected in Alappuzha. Keep all drainage gates open."
    )
    alert_4 = models.AlertHistory(
        farmer_id="KA-2026-000003",
        type="Disease Outbreak",
        message="OUTBREAK Risk: Rice Blast spore density is high in surrounding Alappuzha sector. Spray preventative bio-fungicide immediately."
    )
    db.add_all([alert_1, alert_2, alert_3, alert_4])
    db.commit()

    # 5. Seed Crop Health Logs
    log_1 = models.CropHealthLog(
        farmer_id="KA-2026-000001",
        description="Healthy green leaves on wheat crop.",
        image_path="demo_wheat_leaves.png"
    )
    log_2 = models.CropHealthLog(
        farmer_id="KA-2026-000002",
        description="Cotton plants showing minor leaf curling.",
        image_path="demo_cotton_curl.png"
    )
    log_3 = models.CropHealthLog(
        farmer_id="KA-2026-000003",
        description="Critical rice blast leaf spot patches devouring leaves.",
        image_path="demo_rice_leaves.png"
    )
    db.add_all([log_1, log_2, log_3])
    db.commit()

    # 6. Seed Disease Diagnosis Cases
    # Case 1: Resolved (Healthy farmer case resolved)
    case_1 = models.DiagnosisCase(
        case_id="CASE-2026-000001",
        farmer_id="KA-2026-000001",
        disease_name="Nutrient Depletion",
        confidence=0.88,
        symptoms="yellow_leaves",
        treatment="Apply nitrogen-enriched organic fertilizer.",
        status="resolved",
        priority="Low",
        assigned_officer_id=officer_amit.id,
        officer_remarks="Advised applying organic manure. Crop is fully healthy now.",
        ai_disease_name="Nutrient Depletion",
        ai_confidence=0.92,
        ai_reasoning="Uniform pale leaf tips typical of micro-nutrient deficit.",
        ai_treatment="Organic nitrogen fertilizer dose."
    )

    # Case 2: In Progress (Medium risk farmer)
    case_2 = models.DiagnosisCase(
        case_id="CASE-2026-000002",
        farmer_id="KA-2026-000002",
        disease_name="Cotton Leaf Curl",
        confidence=0.68,
        symptoms="white_insects,leaf_curling",
        treatment="Spray Neem Oil or Diafenthiuron.",
        status="in_progress",
        priority="Medium",
        assigned_officer_id=officer_amit.id,
        officer_remarks="Monitoring whitefly activity. Suggested neem spray.",
        ai_disease_name="Cotton Leaf Curl",
        ai_confidence=0.72,
        ai_reasoning="White insect clusters beneath leaf rolls.",
        ai_treatment="Neem oil application."
    )

    # Case 3: Pending / Critical (Critical risk farmer)
    case_3 = models.DiagnosisCase(
        case_id="CASE-2026-000003",
        farmer_id="KA-2026-000003",
        disease_name="Rice Blast (Fungal)",
        confidence=0.92,
        symptoms="brown_spots,yellow_leaves",
        treatment="Apply approved fungicide Tricyclazole.",
        status="pending",
        priority="Critical",
        ai_disease_name="Rice Blast (Fungal)",
        ai_confidence=0.95,
        ai_reasoning="Spindle-shaped brown lesions with gray centers visible across entire paddy field leaf samples.",
        ai_treatment="Spray Tricyclazole 75 WP at 0.6 g/liter of water immediately."
    )

    db.add_all([case_1, case_2, case_3])
    db.commit()
    logger.info("Demo data preloaded successfully!")
