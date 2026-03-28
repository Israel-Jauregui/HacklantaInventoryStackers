import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc
from sqlmodel import select

from database import init_db, get_session
from models import (
    User, UserCreate, UserRead,
    Report, ReportCreate, ReportRead, ReportReadWithUser
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
    # Startup: Initialize database
    await init_db()
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


# Response model for image analysis
class ImageAnalysisResponse(BaseModel):
    success: bool
    response: str
    model: str


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


# ==================== Report Endpoints ====================

@app.post("/reports", response_model=ReportRead, status_code=201)
async def create_report(
    user_id: uuid.UUID,
    latitude: float,
    longitude: float,
    description: Optional[str] = None,
    image: UploadFile = File(None),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new report with location data and optional image.
    
    - **user_id**: UUID of the user creating the report
    - **latitude**: Latitude coordinate
    - **longitude**: Longitude coordinate
    - **description**: Optional description
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
        
        image_path = str(file_path)
    
    # Create report
    report = Report(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
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


@app.get("/reports", response_model=List[ReportRead])
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_id: Optional[uuid.UUID] = None,
    session: AsyncSession = Depends(get_session)
):
    """List reports with optional filtering by user."""
    statement = select(Report)
    
    if user_id:
        statement = statement.where(Report.user_id == user_id)
    
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
