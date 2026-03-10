"""
Project model — represents a geophysical survey project.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    client_name = Column(String(255), nullable=True)
    location_name = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="active")  # active, completed, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}')>"
