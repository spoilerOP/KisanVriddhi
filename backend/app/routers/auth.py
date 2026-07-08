import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, security

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token)
def register(
    user_reg: schemas.UserRegister,
    farmer_data: schemas.FarmerProfileCreate,
    response: Response,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.username == user_reg.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username (or Mobile Number) is already registered."
        )

    # 1. Create the User record
    password_hash = security.get_password_hash(user_reg.password)
    db_user = models.User(
        username=user_reg.username,
        password_hash=password_hash,
        role=user_reg.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    farmer_id = None
    name = user_reg.username

    # 2. If the user is a farmer, create their profile and generate their unique Farmer ID
    if user_reg.role == "farmer":
        # Format: KA-2026-000001
        current_year = datetime.datetime.now().year
        farmer_count = db.query(models.FarmerProfile).count() + 1
        farmer_id = f"KA-2026-{farmer_count:06d}"
        name = farmer_data.name

        db_profile = models.FarmerProfile(
            user_id=db_user.id,
            farmer_id=farmer_id,
            name=farmer_data.name,
            mobile=farmer_data.mobile,
            state=farmer_data.state,
            district=farmer_data.district,
            village=farmer_data.village,
            preferred_lang=farmer_data.preferred_lang
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)

    # 3. Create tokens
    access_token_expires = datetime.timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": db_user.username, "role": db_user.role},
        expires_delta=access_token_expires
    )
    
    # Set the token in a secure HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none",  # Required for cross-origin (Vercel → Render)
        secure=True,  # Required when samesite=none
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "farmer_id": farmer_id,
        "name": name
    }

@router.post("/login", response_model=schemas.Token)
def login(
    login_data: schemas.UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/mobile or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    farmer_id = None
    name = user.username
    if user.role == "farmer" and user.farmer_profile:
        farmer_id = user.farmer_profile.farmer_id
        name = user.farmer_profile.name

    access_token_expires = datetime.timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    # Set cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none",  # Required for cross-origin (Vercel → Render)
        secure=True,  # Required when samesite=none
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "farmer_id": farmer_id,
        "name": name
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", samesite="lax")
    return {"detail": "Successfully logged out"}

@router.get("/me")
def get_me(
    current_user: models.User = Depends(security.get_current_user)
):
    farmer_id = None
    name = current_user.username
    if current_user.role == "farmer" and current_user.farmer_profile:
        farmer_id = current_user.farmer_profile.farmer_id
        name = current_user.farmer_profile.name
        
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "farmer_id": farmer_id,
        "name": name
    }

from app.demo_data import preload_demo_records
from app.database import engine, Base

@router.post("/demo", response_model=schemas.Token)
def activate_demo_mode(
    response: Response,
    db: Session = Depends(get_db)
):
    import logging
    logger = logging.getLogger(__name__)
    try:
        # Ensure all tables exist before seeding (critical for fresh /tmp databases)
        Base.metadata.create_all(bind=engine)
        preload_demo_records(db)
    except Exception as e:
        logger.error(f"Demo seeding failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed demo records: {str(e)}"
        )

    # Retrieve the seeded farmer Baldev Singh
    user = db.query(models.User).filter(models.User.username == "9876500001").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to seed demo records."
        )


    farmer_id = None
    name = user.username
    if user.farmer_profile:
        farmer_id = user.farmer_profile.farmer_id
        name = user.farmer_profile.name

    access_token_expires = datetime.timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="none",  # Required for cross-origin (Vercel → Render)
        secure=True,  # Required when samesite=none
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "farmer_id": farmer_id,
        "name": name
    }
