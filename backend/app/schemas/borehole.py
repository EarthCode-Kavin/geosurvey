"""Pydantic schemas for Borehole."""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class SoilLayer(BaseModel):
    depth_from: float
    depth_to: float
    description: str
    uscs: Optional[str] = None
    color: Optional[str] = None
    moisture: Optional[str] = None


class SPTValue(BaseModel):
    depth: float
    n_value: int
    blows_1: Optional[int] = None
    blows_2: Optional[int] = None
    blows_3: Optional[int] = None


class CoreRecovery(BaseModel):
    depth_from: float
    depth_to: float
    recovery_pct: float
    rqd_pct: Optional[float] = None


class BoreholeCreate(BaseModel):
    project_id: int
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    elevation: Optional[float] = None
    total_depth: float = Field(..., gt=0)
    groundwater_depth: Optional[float] = None
    drilling_method: Optional[str] = None
    drilling_date: Optional[datetime] = None
    soil_layers: Optional[list[SoilLayer]] = None
    spt_values: Optional[list[SPTValue]] = None
    core_recovery: Optional[list[CoreRecovery]] = None


class BoreholeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    total_depth: Optional[float] = None
    groundwater_depth: Optional[float] = None
    drilling_method: Optional[str] = None
    drilling_date: Optional[datetime] = None
    soil_layers: Optional[list[SoilLayer]] = None
    spt_values: Optional[list[SPTValue]] = None
    core_recovery: Optional[list[CoreRecovery]] = None


class BoreholeResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    total_depth: float
    groundwater_depth: Optional[float] = None
    drilling_method: Optional[str] = None
    drilling_date: Optional[datetime] = None
    soil_layers: Optional[list[dict[str, Any]]] = None
    spt_values: Optional[list[dict[str, Any]]] = None
    core_recovery: Optional[list[dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
