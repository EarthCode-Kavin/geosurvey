"""
Survey model — stores uploaded survey data and processing configuration.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship

from app.database import Base


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Survey configuration
    array_type = Column(String(50), nullable=False)  # wenner, schlumberger, dipole_dipole
    survey_type = Column(String(50), default="resistivity")  # resistivity, ip, em
    electrode_spacing = Column(Float, nullable=True)
    num_electrodes = Column(Integer, nullable=True)

    # File storage
    original_filename = Column(String(500), nullable=True)
    file_path = Column(String(1000), nullable=True)
    file_format = Column(String(50), nullable=True)  # csv, txt, res2dinv

    # Processing
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    processing_engine = Column(String(50), nullable=True)  # simpeg, pygimli
    processing_params = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Survey(id={self.id}, name='{self.name}', array='{self.array_type}')>"
