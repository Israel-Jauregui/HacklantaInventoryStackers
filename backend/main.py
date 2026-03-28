import os
import json
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, func, case, Integer as sqlalchemy_Integer
from sqlmodel import select

from database import init_db, get_session

from models import (
    User, UserCreate, UserRead,
    Report, ReportCreate, ReportRead, ReportReadWithUser,
    ReportStatus
)

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)

# Create uploads directory for images
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup: Initialize database and ensure uploads directory exists
    await init_db()
    UPLOAD_DIR.mkdir(exist_ok=True)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Image Analysis API",
    description="API for analyzing images using Google Gemini with user management and reports",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving static image files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Response model for image analysis
class ImageAnalysisResponse(BaseModel):
    success: bool
    response: str
    model: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    profile_picture: Optional[str] = None


class PotholeAnalysisResponse(BaseModel):
    severity_score: float
    severity_label: str
    description: str
    dimensions: str
    damage_estimate: str


class LeaderboardEntry(BaseModel):
    user_id: str
    username: str
    profile_picture: Optional[str] = None
    score: int
    report_count: int


# ==================== Root Endpoints ====================

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}


# ==================== User Endpoints ====================

@app.post("/users", response_model=UserRead, status_code=201)
async def create_user(
    user: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    """
    Register a new user with their device ID.
    
    - **device_id**: Unique identifier from the app installation
    - **username**: Optional display name for the user
    - **profile_picture**: Optional URL path to profile picture
    
    Returns the created user with their assigned UUID.
    """
    # Check if device_id already exists
    statement = select(User).where(User.device_id == user.device_id)
    result = await session.execute(statement)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this device_id already exists"
        )
    
    db_user = User.model_validate(user)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user


@app.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_session)
):
    """Get a user by their UUID."""
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@app.get("/users/device/{device_id}", response_model=UserRead)
async def get_user_by_device(
    device_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get a user by their device ID."""
    statement = select(User).where(User.device_id == device_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@app.get("/users", response_model=List[UserRead])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session: AsyncSession = Depends(get_session)
):
    """List all users with pagination."""
    statement = select(User).offset(skip).limit(limit)
    result = await session.execute(statement)
    users = result.scalars().all()
    return users


@app.patch("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session)
):
    """
    Update a user's profile information.

    Accepts a JSON body with optional fields: username, profile_picture.
    Returns the updated user.
    """
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.username is not None:
        user.username = body.username
    if body.profile_picture is not None:
        user.profile_picture = body.profile_picture

    user.updated_at = datetime.utcnow()

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@app.post("/users/{user_id}/profile-picture", response_model=UserRead)
async def upload_profile_picture(
    user_id: uuid.UUID,
    image: UploadFile = File(...),
    session: AsyncSession = Depends(get_session)
):
    """
    Upload a profile picture for a user.
    
    - **user_id**: UUID of the user
    - **image**: Image file (JPEG, PNG, GIF, WebP)
    
    Returns the updated user with profile_picture URL.
    """
    # Verify user exists
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Generate unique filename with user_id prefix for organization
    file_ext = image.filename.split(".")[-1] if image.filename else "jpg"
    filename = f"profile_{user_id}_{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Update user's profile picture path
    user.profile_picture = f"/uploads/{filename}"
    user.updated_at = datetime.utcnow()
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ==================== Report Endpoints ====================

@app.post("/reports", response_model=ReportRead, status_code=201)
async def create_report(
    user_id: uuid.UUID,
    latitude: float,
    longitude: float,
    address: str,
    severity_score: float = Query(..., ge=0, le=10),
    status: ReportStatus = ReportStatus.open,
    description: Optional[str] = None,
    image: UploadFile = File(None),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new report with location data and optional image.
    
    - **user_id**: UUID of the user creating the report
    - **latitude**: Latitude coordinate
    - **longitude**: Longitude coordinate
    - **address**: Human-readable address of the location
    - **severity_score**: AI-determined severity score (0-10)
    - **status**: Report status (open or fixed, defaults to open)
    - **description**: Optional notes about the report
    - **image**: Optional image file (JPEG, PNG, GIF, WebP)
    
    Returns the created report.
    """
    # Verify user exists
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle image upload
    image_path = None
    if image:
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Generate unique filename
        file_ext = image.filename.split(".")[-1] if image.filename else "jpg"
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Store URL path for client access (e.g., /uploads/abc123.jpg)
        image_path = f"/uploads/{filename}"
    
    # Create report
    report = Report(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        address=address,
        severity_score=severity_score,
        status=status,
        description=description,
        image_path=image_path
    )
    
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report


@app.get("/reports/{report_id}", response_model=ReportReadWithUser)
async def get_report(
    report_id: uuid.UUID,
    session: AsyncSession = Depends(get_session)
):
    """Get a report by its UUID, including user info."""
    statement = select(Report).where(Report.id == report_id)
    result = await session.execute(statement)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Load user relationship
    await session.refresh(report, ["user"])
    return report


@app.patch("/reports/{report_id}/status", response_model=ReportRead)
async def update_report_status(
    report_id: uuid.UUID,
    status: ReportStatus,
    session: AsyncSession = Depends(get_session)
):
    """
    Update the status of a report.
    
    - **report_id**: UUID of the report to update
    - **status**: New status (open or fixed)
    
    Returns the updated report.
    """
    statement = select(Report).where(Report.id == report_id)
    result = await session.execute(statement)
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = status
    report.updated_at = datetime.utcnow()
    
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report


@app.get("/reports", response_model=List[ReportRead])
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_id: Optional[uuid.UUID] = None,
    status: Optional[ReportStatus] = None,
    min_severity: Optional[float] = Query(None, ge=0, le=10),
    session: AsyncSession = Depends(get_session)
):
    """List reports with optional filtering by user, status, and severity."""
    statement = select(Report)
    
    if user_id:
        statement = statement.where(Report.user_id == user_id)
    
    if status:
        statement = statement.where(Report.status == status)
    
    if min_severity is not None:
        statement = statement.where(Report.severity_score >= min_severity)
    
    statement = statement.offset(skip).limit(limit)
    # Order by created_at descending (most recent first)
    statement = statement.order_by(desc(Report.created_at))
    result = await session.execute(statement)
    reports = result.scalars().all()
    return reports


@app.get("/users/{user_id}/reports", response_model=List[ReportRead])
async def get_user_reports(
    user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session: AsyncSession = Depends(get_session)
):
    """Get all reports for a specific user."""
    # Verify user exists
    user_statement = select(User).where(User.id == user_id)
    user_result = await session.execute(user_statement)
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    statement = (
        select(Report)
        .where(Report.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(desc(Report.created_at))
    )
    result = await session.execute(statement)
    reports = result.scalars().all()
    return reports


# ==================== Image Analysis Endpoints ====================

@app.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    prompt: str = "Describe this image in detail."
):
    """
    Analyze an uploaded image using Google Gemini.
    
    - **image**: The image file to analyze (supports JPEG, PNG, GIF, WebP)
    - **prompt**: Optional custom prompt for the analysis (default: "Describe this image in detail.")
    
    Returns Gemini's analysis of the image.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        # Read the image file
        image_data = await image.read()
        
        # Open with PIL to validate it's a proper image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Initialize Gemini model (using gemini-2.5-flash for image analysis)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Generate content with the image
        response = model.generate_content([prompt, pil_image])
        
        return ImageAnalysisResponse(
            success=True,
            response=response.text,
            model="gemini-2.5-flash"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


# ==================== Pothole-Specific Analysis ====================

@app.post("/analyze-pothole", response_model=PotholeAnalysisResponse)
async def analyze_pothole(
    image: UploadFile = File(...),
):
    """
    Analyze a pothole image and return structured severity data.

    Uses Gemini to evaluate the pothole's size, depth, and risk.
    Returns a severity score (0-10), label, description, estimated
    dimensions, and potential vehicle-damage cost range.
    """
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )

    try:
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))

        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = (
            "You are a road-damage assessment AI. Analyze this pothole image and "
            "return ONLY a JSON object with these exact keys (no markdown, no extra text):\n"
            '{"severity_score": <float 0-10>, "severity_label": "<Critical|Moderate|Minor>", '
            '"description": "<1-2 sentence summary>", "dimensions": "<estimated width x depth in inches>", '
            '"damage_estimate": "<vehicle repair cost range like $200 – $800>"}'
        )

        response = model.generate_content([prompt, pil_image])
        # Strip markdown fences if Gemini wraps them
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        data = json.loads(raw)

        return PotholeAnalysisResponse(
            severity_score=max(0.0, min(10.0, float(data.get("severity_score", 5.0)))),
            severity_label=data.get("severity_label", "Moderate"),
            description=data.get("description", "Pothole detected."),
            dimensions=data.get("dimensions", "Unknown"),
            damage_estimate=data.get("damage_estimate", "$100 – $500"),
        )

    except json.JSONDecodeError:
        # Gemini didn't return valid JSON — return a safe default
        return PotholeAnalysisResponse(
            severity_score=5.0,
            severity_label="Moderate",
            description="AI analysis could not be fully parsed. Manual review recommended.",
            dimensions="Unknown",
            damage_estimate="$100 – $500",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing pothole: {str(e)}"
        )


# ==================== Leaderboard ====================

@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session)
):
    """
    Return a ranked leaderboard of users.

    Score = 10 points per report + 5 bonus per report with severity >= 7.5.
    """
    statement = (
        select(
            User.id.label("user_id"),
            User.username,
            User.profile_picture,
            func.count(Report.id).label("report_count"),
            (
                func.count(Report.id) * 10
                + func.coalesce(
                    func.sum(case((Report.severity_score >= 7.5, 5), else_=0)),
                    0,
                )
            ).label("score"),
        )
        .join(Report, Report.user_id == User.id)
        .group_by(User.id, User.username, User.profile_picture)
        .order_by(desc("score"))
        .limit(limit)
    )
    result = await session.execute(statement)
    rows = result.all()

    return [
        LeaderboardEntry(
            user_id=str(r.user_id),
            username=r.username,
            profile_picture=r.profile_picture,
            score=int(r.score or 0),
            report_count=int(r.report_count),
        )
        for r in rows
    ]


@app.post("/analyze-image-with-context", response_model=ImageAnalysisResponse)
async def analyze_image_with_context(
    image: UploadFile = File(...),
    prompt: str = "What do you see in this image?",
    context: str | None = None
):
    """
    Analyze an uploaded image with additional context using Google Gemini.
    
    - **image**: The image file to analyze
    - **prompt**: The question or instruction for the analysis
    - **context**: Optional additional context to help with the analysis
    
    Returns Gemini's analysis of the image.
    """
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Build the prompt with context if provided
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\n{prompt}"
        
        response = model.generate_content([full_prompt, pil_image])
        
        return ImageAnalysisResponse(
            success=True,
            response=response.text,
            model="gemini-2.5-flash"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )
