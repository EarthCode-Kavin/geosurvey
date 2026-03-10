"""Pydantic schemas for Processing requests and results."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class ProcessingRequest(BaseModel):
    survey_id: int
    engine: str = Field(..., pattern="^(simpeg|pygimli)$")
    method: str = Field(default="inversion")  # inversion, forward_model, ert
    params: Optional[dict[str, Any]] = None
    # Optional params examples:
    # {"max_iterations": 20, "beta0_ratio": 1.0, "coolingFactor": 2}


class ProcessingResultResponse(BaseModel):
    id: int
    survey_id: int
    engine_type: str
    processing_method: Optional[str] = None
    result_data: Optional[dict[str, Any]] = None
    model_data: Optional[dict[str, Any]] = None
    rms_misfit: Optional[float] = None
    chi_squared: Optional[float] = None
    iterations: Optional[int] = None
    output_files: Optional[dict[str, str]] = None
    plot_data: Optional[dict[str, Any]] = None
    created_at: datetime
    processing_duration_seconds: Optional[float] = None

    class Config:
        from_attributes = True
