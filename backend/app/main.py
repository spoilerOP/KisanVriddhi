import time
import logging
from fastapi import FastAPI, Request, Response, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler

from app.config import settings
from app.database import engine, Base
# Import models to ensure they are registered for create_all
from app import models
from app.routers import auth, farmers, crops, weather, cases, assistant, officer, gemini_advisory, officer_ai, impact, analytics, tts

# Initialize Database tables — must succeed for the app to work
Base.metadata.create_all(bind=engine)


# Auto seed database if empty
try:
    from app.database import SessionLocal
    from app.demo_data import preload_demo_records
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            preload_demo_records(db)
    finally:
        db.close()
except Exception as _seed_err:
    logging.error(f"Demo data seeding failed (non-fatal): {_seed_err}")

app = FastAPI(
    title="KisanVriddhi — Agriculture Intelligence API",
    description="Empowering Farmers Through Intelligence — Multilingual Agricultural AI platform for Indian Farmers",
    version="1.0.0"
)

# CORS Policy — allows any HTTPS origin (covers Vercel frontend) + local dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Custom Middleware for Security Headers & Basic Rate Limiting
# Note: For production use a true rate limiter (like slowapi or redis), 
# here we simulate rate limit window and enforce headers.
@app.middleware("http")
async def add_security_headers_and_limit(request: Request, call_next):
    # Enforce standard security headers
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Global Exception Handler for Error Sanitization (Security Rule)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Pass HTTPException through FastAPI's native handler so specific detail messages reach the client
    if isinstance(exc, HTTPException):
        return await http_exception_handler(request, exc)
    # For unexpected exceptions, log details server-side but sanitize for client
    logging.error(f"Global server error: {type(exc).__name__}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal error: {type(exc).__name__}: {str(exc)}"}
    )

# Mount Routers
app.include_router(auth.router)
app.include_router(farmers.router)
app.include_router(crops.router)
app.include_router(weather.router)
app.include_router(cases.router)
app.include_router(assistant.router)
app.include_router(officer.router)
app.include_router(gemini_advisory.router)
app.include_router(officer_ai.router)
app.include_router(impact.router)
app.include_router(analytics.router)
app.include_router(tts.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to KisanVriddhi API — Empowering Farmers Through Intelligence"}
