"""
GeoSurvey Platform — FastAPI Application
Main entry point with CORS, router mounting, and startup events.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import projects, surveys, boreholes, processing, visualization, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: create upload and report directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.REPORT_OUTPUT_DIR, exist_ok=True)

    # Create tables (for development — use Alembic in production)
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables created / verified.")
    except Exception as e:
        print(f"[WARN] Could not create tables: {e}")

    yield

    # Shutdown cleanup (if needed)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Open-source web platform for Geotechnical & Geophysical Survey Analysis. "
        "Integrates SimPEG and pyGIMLi for scientific computation with interactive "
        "Plotly.js visualizations and automated PDF reporting."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api
app.include_router(projects.router, prefix="/api")
app.include_router(surveys.router, prefix="/api")
app.include_router(boreholes.router, prefix="/api")
app.include_router(processing.router, prefix="/api")
app.include_router(visualization.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    """Health check / welcome endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Root"])
def health_check():
    """API health check endpoint."""
    return {"status": "healthy"}
