"""
ProcessingResult model — stores output from SimPEG/pyGIMLi processing.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float

from app.database import Base


class ProcessingResult(Base):
    __tablename__ = "processing_results"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False, index=True)

    # Engine used
    engine_type = Column(String(50), nullable=False)  # simpeg, pygimli
    processing_method = Column(String(100), nullable=True)  # inversion, forward_model, ert

    # Result data
    result_data = Column(JSON, nullable=True)
    # Stores: mesh coordinates, resistivity values, misfit data, etc.

    model_data = Column(JSON, nullable=True)
    # Stores: inversion model parameters, convergence info

    # Quality metrics
    rms_misfit = Column(Float, nullable=True)
    chi_squared = Column(Float, nullable=True)
    iterations = Column(Integer, nullable=True)

    # Output files
    output_files = Column(JSON, nullable=True)
    # Example: {"resistivity_section": "/path/to/img.png", "mesh_file": "/path/to/mesh.vtk"}

    # Visualization data (pre-computed for frontend)
    plot_data = Column(JSON, nullable=True)
    # Stores Plotly-compatible trace data and Three.js mesh data

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processing_duration_seconds = Column(Float, nullable=True)

    def __repr__(self):
        return f"<ProcessingResult(id={self.id}, engine='{self.engine_type}', rms={self.rms_misfit})>"
