"""
Processing router — trigger geophysical processing using SimPEG or pyGIMLi.
"""

import sys
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.survey import Survey
from app.models.processing_result import ProcessingResult
from app.schemas.processing import ProcessingRequest, ProcessingResultResponse

# Add scientific-engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "scientific-engine"))

router = APIRouter(prefix="/processing", tags=["Processing"])


@router.post("/run", response_model=ProcessingResultResponse, status_code=201)
def run_processing(request: ProcessingRequest, db: Session = Depends(get_db)):
    """
    Trigger geophysical processing on an uploaded survey.
    Supports SimPEG inversion and pyGIMLi ERT modelling.
    """
    survey = db.query(Survey).filter(Survey.id == request.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if not survey.file_path or not os.path.exists(survey.file_path):
        raise HTTPException(status_code=400, detail="No survey data file uploaded")

    # Update survey status
    survey.processing_status = "processing"
    survey.processing_engine = request.engine
    survey.processing_params = request.params
    db.commit()

    import time
    start_time = time.time()

    try:
        if request.engine == "simpeg":
            from engine.simpeg_runner import SimpegInversionRunner
            runner = SimpegInversionRunner()
            result = runner.run(
                file_path=survey.file_path,
                file_format=survey.file_format,
                array_type=survey.array_type,
                params=request.params or {},
            )
        elif request.engine == "pygimli":
            from engine.pygimli_runner import PyGIMLiModellingRunner
            runner = PyGIMLiModellingRunner()
            result = runner.run(
                file_path=survey.file_path,
                file_format=survey.file_format,
                array_type=survey.array_type,
                params=request.params or {},
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown engine: {request.engine}")

        elapsed = time.time() - start_time

        # Save processing result
        proc_result = ProcessingResult(
            survey_id=survey.id,
            engine_type=request.engine,
            processing_method=request.method,
            result_data=result.get("result_data"),
            model_data=result.get("model_data"),
            rms_misfit=result.get("rms_misfit"),
            chi_squared=result.get("chi_squared"),
            iterations=result.get("iterations"),
            output_files=result.get("output_files"),
            plot_data=result.get("plot_data"),
            processing_duration_seconds=elapsed,
        )
        db.add(proc_result)

        survey.processing_status = "completed"
        survey.processed_at = datetime.utcnow()
        db.commit()
        db.refresh(proc_result)
        return proc_result

    except Exception as e:
        survey.processing_status = "failed"
        survey.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/results/{survey_id}", response_model=list[ProcessingResultResponse])
def get_results(survey_id: int, db: Session = Depends(get_db)):
    """Get all processing results for a survey."""
    results = db.query(ProcessingResult).filter(
        ProcessingResult.survey_id == survey_id
    ).order_by(ProcessingResult.created_at.desc()).all()
    return results


@router.get("/result/{result_id}", response_model=ProcessingResultResponse)
def get_result(result_id: int, db: Session = Depends(get_db)):
    """Get a single processing result by ID."""
    result = db.query(ProcessingResult).filter(ProcessingResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Processing result not found")
    return result
