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
        name="Baldev Singh",
        mobile="9876500001",
        state="Punjab",
        district="Bhatinda",
        village="Haripur",
        preferred_lang="hi",
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
        name="Anji Reddy",
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
        name="Sreedharan Nair",
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

    # 4. Seed Weather Alerts (3 Alerts)
    alert_1 = models.AlertHistory(
        farmer_id="KA-2026-000001",
        type="Heat Wave",
        message="Heat Wave Warning: Temperatures are forecast to exceed 42°C in Bhatinda. Apply surface mulching to conserve root moisture."
    )
    alert_2 = models.AlertHistory(
        farmer_id="KA-2026-000002",
        type="Dry Spell",
        message="Dry Spell Warning: Zero precipitation is forecast for the next 7 days in Guntur. Initiate supplementary drip irrigation."
    )
    alert_3 = models.AlertHistory(
        farmer_id="KA-2026-000003",
        type="Heavy Rain",
        message="Heavy Rain Warning: Outflow and local downpour risk is High in Alappuzha. Keep field channels open."
    )
    db.add_all([alert_1, alert_2, alert_3])
    db.commit()

    # 5. Seed Crop Health Logs
    log_1 = models.CropHealthLog(
        farmer_id="KA-2026-000001",
        description="Paddy leaves turning yellow and curling slightly.",
        image_path="demo_rice_leaves.png"
    )
    log_2 = models.CropHealthLog(
        farmer_id="KA-2026-000002",
        description="Cotton plants showing leaf curling with white bugs under leaves.",
        image_path="demo_cotton_curl.png"
    )
    db.add_all([log_1, log_2])
    db.commit()

    # 6. Seed Disease Diagnosis Cases (3 Cases, 2 Officer Reviews)
    # Case 1: Pending (low confidence, auto-referred)
    case_1 = models.DiagnosisCase(
        case_id="CASE-2026-000001",
        farmer_id="KA-2026-000001",
        disease_name="Rice Blast (Fungal)",
        confidence=0.55,
        symptoms="yellow_leaves,brown_spots",
        treatment="Spray Tricyclazole 75 WP at 0.6 g/liter of water.",
        status="pending",
        priority="High"
    )

    # Case 2: In Progress (assigned, being reviewed by Officer Amit)
    case_2 = models.DiagnosisCase(
        case_id="CASE-2026-000002",
        farmer_id="KA-2026-000002",
        disease_name="Cotton Whitefly Infestation",
        confidence=0.68,
        symptoms="white_insects,leaf_curling",
        treatment="Spray Neem Oil or Diafenthiuron.",
        status="in_progress",
        priority="High",
        assigned_officer_id=officer_amit.id,
        officer_remarks="Under audit. Recommending organic bio-sprays first."
    )

    # Case 3: Resolved (solved by Officer Amit)
    case_3 = models.DiagnosisCase(
        case_id="CASE-2026-000003",
        farmer_id="KA-2026-000003",
        disease_name="Rice Blast (Fungal)",
        confidence=0.72,
        symptoms="brown_spots,yellow_leaves",
        treatment="Apply approved fungicide Tricyclazole.",
        status="resolved",
        priority="Medium",
        assigned_officer_id=officer_amit.id,
        officer_remarks="Spoke with kisan directly. Advised draining the fields slightly and applying Tricyclazole. Confirming resolving of the ticket."
    )

    db.add_all([case_1, case_2, case_3])
    db.commit()
    logger.info("Demo data preloaded successfully!")
