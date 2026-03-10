"""
Surveys router — upload survey data, manage surveys, trigger processing.
"""

import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.config import settings
from app.models.survey import Survey
from app.models.project import Project
from app.schemas.survey import SurveyCreate, SurveyUpdate, SurveyResponse

router = APIRouter(prefix="/surveys", tags=["Surveys"])


@router.get("/", response_model=list[SurveyResponse])
def list_surveys(
    project_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List surveys, optionally filtered by project."""
    query = db.query(Survey)
    if project_id:
        query = query.filter(Survey.project_id == project_id)
    return query.order_by(Survey.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{survey_id}", response_model=SurveyResponse)
def get_survey(survey_id: int, db: Session = Depends(get_db)):
    """Get a single survey by ID."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@router.post("/", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
def create_survey(data: SurveyCreate, db: Session = Depends(get_db)):
    """Create a new survey entry (without file upload)."""
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    survey = Survey(**data.model_dump())
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey


@router.post("/{survey_id}/upload", response_model=SurveyResponse)
async def upload_survey_file(
    survey_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a survey data file (CSV, TXT, or RES2DINV format)."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    # Validate file extension
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    allowed = {".csv", ".txt", ".dat", ".res", ".ohm"}
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(allowed)}",
        )

    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(survey.project_id), str(survey.id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Detect format
    format_map = {".csv": "csv", ".txt": "txt", ".dat": "res2dinv", ".res": "res2dinv", ".ohm": "ohm"}
    survey.original_filename = filename
    survey.file_path = file_path
    survey.file_format = format_map.get(ext, "unknown")
    survey.processing_status = "uploaded"

    db.commit()
    db.refresh(survey)
    return survey


@router.put("/{survey_id}", response_model=SurveyResponse)
def update_survey(survey_id: int, data: SurveyUpdate, db: Session = Depends(get_db)):
    """Update survey metadata."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(survey, key, value)
    db.commit()
    db.refresh(survey)
    return survey


@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(survey_id: int, db: Session = Depends(get_db)):
    """Delete a survey and its uploaded files."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    # Clean up files
    if survey.file_path and os.path.exists(os.path.dirname(survey.file_path)):
        shutil.rmtree(os.path.dirname(survey.file_path), ignore_errors=True)
    db.delete(survey)
    db.commit()
