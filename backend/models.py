import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class ReportStatus(str, Enum):
    """Status options for a report."""
    open = "open"
    fixed = "fixed"


class UserBase(SQLModel):
    """Base user model with shared fields."""
    device_id: str = Field(index=True, unique=True, description="Device identifier from app installation")
    username: str = Field(max_length=50, description="Display name for the user")
    profile_picture: Optional[str] = Field(default=None, description="URL path to user's profile picture")


class User(UserBase, table=True):
    """User database model."""
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to reports
    reports: List["Report"] = Relationship(back_populates="user")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    pass


class UserRead(UserBase):
    """Schema for reading user data."""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ReportBase(SQLModel):
    """Base report model with shared fields."""
    latitude: float = Field(description="Latitude coordinate of the report location")
    longitude: float = Field(description="Longitude coordinate of the report location")
    address: str = Field(description="Human-readable address of the report location")
    severity_score: float = Field(ge=0, le=10, description="AI-determined severity score from 0-10")
    status: ReportStatus = Field(default=ReportStatus.open, description="Current status of the report")
    description: Optional[str] = Field(default=None, description="Optional notes about the report")


class Report(ReportBase, table=True):
    """Report database model."""
    __tablename__ = "reports"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    image_path: Optional[str] = Field(default=None, description="Path to stored image file")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to user
    user: Optional[User] = Relationship(back_populates="reports")


class ReportCreate(ReportBase):
    """Schema for creating a new report."""
    pass


class ReportRead(ReportBase):
    """Schema for reading report data."""
    id: uuid.UUID
    user_id: uuid.UUID
    image_path: Optional[str]
    created_at: datetime
    updated_at: datetime


class ReportReadWithUser(ReportRead):
    """Schema for reading report with user data."""
    user: Optional[UserRead] = None
