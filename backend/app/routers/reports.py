"""
Reports router — generate and download PDF reports.
"""

import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.project import Project
from app.models.survey import Survey
from app.models.borehole import Borehole
from app.models.processing_result import ProcessingResult
from app.services.report_generator import generate_project_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate/{project_id}")
def generate_report(project_id: int, db: Session = Depends(get_db)):
    """Generate a comprehensive PDF report for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    surveys = db.query(Survey).filter(Survey.project_id == project_id).all()
    boreholes = db.query(Borehole).filter(Borehole.project_id == project_id).all()

    # Gather all processing results
    results = []
    for s in surveys:
        survey_results = db.query(ProcessingResult).filter(
            ProcessingResult.survey_id == s.id
        ).all()
        results.extend(survey_results)

    # Generate the PDF
    os.makedirs(settings.REPORT_OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(settings.REPORT_OUTPUT_DIR, f"report_project_{project_id}.pdf")

    generate_project_report(
        output_path=output_path,
        project=project,
        surveys=surveys,
        boreholes=boreholes,
        results=results,
    )

    return {
        "message": "Report generated successfully",
        "file_path": output_path,
        "download_url": f"/api/reports/download/{project_id}",
    }


@router.get("/download/{project_id}")
def download_report(project_id: int):
    """Download a generated PDF report."""
    output_path = os.path.join(settings.REPORT_OUTPUT_DIR, f"report_project_{project_id}.pdf")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Report not found. Generate it first.")
    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=f"GeoSurvey_Report_Project_{project_id}.pdf",
    )
