"""Pydantic schemas for Survey."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class SurveyCreate(BaseModel):
    project_id: int
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    array_type: str = Field(...)  # Expanded from strict regex to support Gravity, EM, etc.
    survey_type: str = Field(default="resistivity")
    electrode_spacing: Optional[float] = None
    num_electrodes: Optional[int] = None


class SurveyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    array_type: Optional[str] = None
    electrode_spacing: Optional[float] = None
    num_electrodes: Optional[int] = None


class SurveyResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    array_type: str
    survey_type: str
    electrode_spacing: Optional[float] = None
    num_electrodes: Optional[int] = None
    original_filename: Optional[str] = None
    file_format: Optional[str] = None
    processing_status: str
    processing_engine: Optional[str] = None
    processing_params: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
