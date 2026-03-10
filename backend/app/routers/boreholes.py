"""
Boreholes router — CRUD for geotechnical borehole logs.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.borehole import Borehole
from app.models.project import Project
from app.schemas.borehole import BoreholeCreate, BoreholeUpdate, BoreholeResponse

router = APIRouter(prefix="/boreholes", tags=["Boreholes"])


@router.get("/", response_model=list[BoreholeResponse])
def list_boreholes(
    project_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List boreholes, optionally filtered by project."""
    query = db.query(Borehole)
    if project_id:
        query = query.filter(Borehole.project_id == project_id)
    return query.order_by(Borehole.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{borehole_id}", response_model=BoreholeResponse)
def get_borehole(borehole_id: int, db: Session = Depends(get_db)):
    """Get a single borehole by ID."""
    bh = db.query(Borehole).filter(Borehole.id == borehole_id).first()
    if not bh:
        raise HTTPException(status_code=404, detail="Borehole not found")
    return bh


@router.post("/", response_model=BoreholeResponse, status_code=status.HTTP_201_CREATED)
def create_borehole(data: BoreholeCreate, db: Session = Depends(get_db)):
    """Create a new borehole log."""
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    bh_data = data.model_dump()
    # Convert nested Pydantic models to dicts for JSON storage
    if bh_data.get("soil_layers"):
        bh_data["soil_layers"] = [sl if isinstance(sl, dict) else sl for sl in bh_data["soil_layers"]]
    if bh_data.get("spt_values"):
        bh_data["spt_values"] = [sv if isinstance(sv, dict) else sv for sv in bh_data["spt_values"]]
    if bh_data.get("core_recovery"):
        bh_data["core_recovery"] = [cr if isinstance(cr, dict) else cr for cr in bh_data["core_recovery"]]

    borehole = Borehole(**bh_data)
    if data.latitude is not None and data.longitude is not None:
        from geoalchemy2.elements import WKTElement
        borehole.location = WKTElement(f"POINT({data.longitude} {data.latitude})", srid=4326)
    db.add(borehole)
    db.commit()
    db.refresh(borehole)
    return borehole


@router.put("/{borehole_id}", response_model=BoreholeResponse)
def update_borehole(borehole_id: int, data: BoreholeUpdate, db: Session = Depends(get_db)):
    """Update a borehole log."""
    bh = db.query(Borehole).filter(Borehole.id == borehole_id).first()
    if not bh:
        raise HTTPException(status_code=404, detail="Borehole not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(bh, key, value)
    db.commit()
    db.refresh(bh)
    return bh


@router.delete("/{borehole_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_borehole(borehole_id: int, db: Session = Depends(get_db)):
    """Delete a borehole log."""
    bh = db.query(Borehole).filter(Borehole.id == borehole_id).first()
    if not bh:
        raise HTTPException(status_code=404, detail="Borehole not found")
    db.delete(bh)
    db.commit()
