import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(
    title="Image Analysis API",
    description="API for analyzing images using Google Gemini",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response model
class ImageAnalysisResponse(BaseModel):
    success: bool
    response: str
    model: str


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}


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
            model="gemini-1.5-flash"
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
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Build the prompt with context if provided
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\n{prompt}"
        
        response = model.generate_content([full_prompt, pil_image])
        
        return ImageAnalysisResponse(
            success=True,
            response=response.text,
            model="gemini-1.5-flash"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )
