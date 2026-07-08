from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

import os

# Ensure target directory exists for SQLite databases to prevent OperationalError crashes
if settings.DATABASE_URL.startswith("sqlite"):
    db_file_path = settings.DATABASE_URL.replace("sqlite:///", "")
    # Check if a directory prefix is present (e.g. ./data/kisan_alert.db)
    db_dir = os.path.dirname(db_file_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

# Initialize Database Engine with failsafe fallback to /tmp
try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL, connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(settings.DATABASE_URL)
    # Force connection test to verify write permissions
    engine.connect().close()
except Exception as e:
    if settings.DATABASE_URL.startswith("sqlite"):
        fallback_url = "sqlite:////tmp/kisan_alert.db"
        print(f"DATABASE WARNING: Primary SQLite path is not writable. Falling back to /tmp: {fallback_url}. Details: {str(e)}")
        engine = create_engine(
            fallback_url, connect_args={"check_same_thread": False}
        )
    else:
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    """Ensure SQLite schema is updated dynamically with AI analysis fields if already existing."""
    inspector = inspect(engine)
    if "diagnosis_cases" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("diagnosis_cases")]
        with engine.begin() as conn:
            if "ai_disease_name" not in columns:
                conn.execute(text("ALTER TABLE diagnosis_cases ADD COLUMN ai_disease_name VARCHAR"))
            if "ai_confidence" not in columns:
                conn.execute(text("ALTER TABLE diagnosis_cases ADD COLUMN ai_confidence FLOAT"))
            if "ai_reasoning" not in columns:
                conn.execute(text("ALTER TABLE diagnosis_cases ADD COLUMN ai_reasoning VARCHAR"))
            if "ai_treatment" not in columns:
                conn.execute(text("ALTER TABLE diagnosis_cases ADD COLUMN ai_treatment VARCHAR"))

# Run migrations immediately on startup/import
run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
