import os
import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

def _create_sqlite_engine(db_url: str):
    """Create a SQLite engine, ensuring the parent directory exists."""
    # Strip the sqlite:/// prefix to get the file path
    # Handle both 3-slash (relative) and 4-slash (absolute) forms
    if db_url.startswith("sqlite:////"):
        file_path = "/" + db_url[len("sqlite:////"):]
    elif db_url.startswith("sqlite:///"):
        file_path = db_url[len("sqlite:///"):]
    else:
        file_path = db_url

    # Create parent directory if needed
    parent_dir = os.path.dirname(os.path.abspath(file_path))
    if parent_dir and not os.path.exists(parent_dir):
        try:
            os.makedirs(parent_dir, exist_ok=True)
            logger.info(f"Created database directory: {parent_dir}")
        except OSError as e:
            logger.warning(f"Could not create directory {parent_dir}: {e}")

    return create_engine(db_url, connect_args={"check_same_thread": False})


def _init_engine():
    """Initialize the database engine with fallback to /tmp on failure."""
    db_url = settings.DATABASE_URL

    if not db_url.startswith("sqlite"):
        # PostgreSQL or other — use directly
        return create_engine(db_url)

    # Try primary SQLite path
    try:
        engine = _create_sqlite_engine(db_url)
        # Test the connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database connected successfully: {db_url}")
        return engine
    except Exception as e:
        logger.warning(f"Primary database path failed ({db_url}): {e}")

    # Fallback: /tmp is always writable in Docker/Render containers
    fallback_url = "sqlite:////tmp/kisan_alert.db"
    logger.warning(f"Falling back to writable temp path: {fallback_url}")
    try:
        engine = _create_sqlite_engine(fallback_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Fallback database connected: {fallback_url}")
        return engine
    except Exception as e2:
        logger.error(f"Fallback database also failed: {e2}")
        raise RuntimeError(f"Cannot open any SQLite database. Primary: {db_url}, Fallback: {fallback_url}") from e2


# Initialize engine
engine = _init_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_migrations():
    """Ensure SQLite schema is updated dynamically with AI analysis fields if already existing."""
    try:
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
    except Exception as e:
        logger.warning(f"Migration check skipped (non-fatal): {e}")


# Run migrations immediately on startup/import
run_migrations()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
