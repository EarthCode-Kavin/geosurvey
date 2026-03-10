"""
Borehole model — geotechnical borehole logging data.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float

from app.database import Base


class Borehole(Base):
    __tablename__ = "boreholes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)

    # Borehole data
    total_depth = Column(Float, nullable=False)  # meters
    groundwater_depth = Column(Float, nullable=True)  # meters below surface
    drilling_method = Column(String(100), nullable=True)
    drilling_date = Column(DateTime, nullable=True)

    # Geotechnical data stored as JSON arrays
    soil_layers = Column(JSON, nullable=True)
    # Example: [{"depth_from": 0, "depth_to": 2.5, "description": "Topsoil", "uscs": "OH", "color": "brown"}]

    spt_values = Column(JSON, nullable=True)
    # Example: [{"depth": 1.5, "n_value": 8, "blows_1": 3, "blows_2": 2, "blows_3": 3}]

    core_recovery = Column(JSON, nullable=True)
    # Example: [{"depth_from": 0, "depth_to": 1.5, "recovery_pct": 85, "rqd_pct": 60}]

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Borehole(id={self.id}, name='{self.name}', depth={self.total_depth}m)>"
