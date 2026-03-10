"""
Visualization router — serve pre-computed plot data for frontend rendering.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.processing_result import ProcessingResult
from app.models.survey import Survey
from app.models.borehole import Borehole

router = APIRouter(prefix="/visualization", tags=["Visualization"])


@router.get("/resistivity-section/{result_id}")
def get_resistivity_section(result_id: int, db: Session = Depends(get_db)):
    """Return Plotly-compatible data for a 2D resistivity section plot."""
    result = db.query(ProcessingResult).filter(ProcessingResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    plot_data = result.plot_data or {}
    resistivity_section = plot_data.get("resistivity_section")
    if not resistivity_section:
        raise HTTPException(status_code=404, detail="No resistivity section data available")

    return {
        "type": "resistivity_section",
        "engine": result.engine_type,
        "rms_misfit": result.rms_misfit,
        "iterations": result.iterations,
        "plotly_data": resistivity_section,
    }


@router.get("/mesh-3d/{result_id}")
def get_mesh_3d(result_id: int, db: Session = Depends(get_db)):
    """Return Three.js compatible mesh data for 3D subsurface rendering."""
    result = db.query(ProcessingResult).filter(ProcessingResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    plot_data = result.plot_data or {}
    mesh_data = plot_data.get("mesh_3d")
    if not mesh_data:
        raise HTTPException(status_code=404, detail="No 3D mesh data available")

    return {
        "type": "mesh_3d",
        "engine": result.engine_type,
        "threejs_data": mesh_data,
    }


@router.get("/survey-map/{project_id}")
def get_survey_map_data(project_id: int, db: Session = Depends(get_db)):
    """Return GeoJSON data for survey locations on a Leaflet map."""
    surveys = db.query(Survey).filter(Survey.project_id == project_id).all()
    boreholes = db.query(Borehole).filter(Borehole.project_id == project_id).all()

    features = []

    for s in surveys:
        if s.processing_status:
            features.append({
                "type": "Feature",
                "geometry": None,  # Will use project geometry
                "properties": {
                    "id": s.id,
                    "name": s.name,
                    "type": "survey",
                    "array_type": s.array_type,
                    "status": s.processing_status,
                },
            })

    for b in boreholes:
        if b.latitude and b.longitude:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [b.longitude, b.latitude],
                },
                "properties": {
                    "id": b.id,
                    "name": b.name,
                    "type": "borehole",
                    "depth": b.total_depth,
                    "groundwater_depth": b.groundwater_depth,
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/borehole-log/{borehole_id}")
def get_borehole_log_data(borehole_id: int, db: Session = Depends(get_db)):
    """Return structured data for borehole log visualization."""
    bh = db.query(Borehole).filter(Borehole.id == borehole_id).first()
    if not bh:
        raise HTTPException(status_code=404, detail="Borehole not found")

    return {
        "type": "borehole_log",
        "name": bh.name,
        "total_depth": bh.total_depth,
        "groundwater_depth": bh.groundwater_depth,
        "elevation": bh.elevation,
        "soil_layers": bh.soil_layers or [],
        "spt_values": bh.spt_values or [],
        "core_recovery": bh.core_recovery or [],
    }
