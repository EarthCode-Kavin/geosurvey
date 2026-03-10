# System Architecture

## Overview

The GeoSurvey Platform follows a three-tier architecture with a clear separation between the presentation layer (frontend), business logic (backend API), and scientific computation (engine).

## Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        UI["React Pages"]
        Plotly["Plotly.js Visualizations"]
        Three["Three.js 3D Viewer"]
        Leaflet["Leaflet.js Map"]
        API_Client["API Client (TypeScript)"]
    end

    subgraph Backend["Backend (FastAPI)"]
        Routers["API Routers"]
        Services["Services"]
        Models["SQLAlchemy Models"]
        Schemas["Pydantic Schemas"]
    end

    subgraph Engine["Scientific Engine"]
        SimPEG["SimPEG Runner"]
        pyGIMLi["pyGIMLi Runner"]
        DataLoader["Data Loader"]
        MeshUtils["Mesh Utilities"]
        VizData["Visualization Data Generator"]
    end

    subgraph Data["Data Layer"]
        DB["PostgreSQL + PostGIS"]
        Redis["Redis"]
        Files["File Storage"]
    end

    UI --> API_Client
    API_Client --> Routers
    Routers --> Services
    Routers --> Models
    Models --> DB
    Services --> Engine
    Services --> Files
    Routers --> Redis
    SimPEG --> DataLoader
    pyGIMLi --> DataLoader
    SimPEG --> MeshUtils
    pyGIMLi --> MeshUtils
    SimPEG --> VizData
    pyGIMLi --> VizData
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Engine
    participant Database

    User->>Frontend: Upload survey data
    Frontend->>Backend: POST /api/surveys/{id}/upload
    Backend->>Database: Save file metadata
    Backend-->>Frontend: Survey updated

    User->>Frontend: Trigger processing
    Frontend->>Backend: POST /api/processing/run
    Backend->>Engine: Run inversion
    Engine->>Engine: Load data → Mesh → Invert
    Engine-->>Backend: Result + plot data
    Backend->>Database: Save ProcessingResult
    Backend-->>Frontend: Processing complete

    User->>Frontend: View visualization
    Frontend->>Backend: GET /api/visualization/*
    Backend->>Database: Fetch plot data
    Backend-->>Frontend: JSON plot data
    Frontend->>Frontend: Render Plotly/Three.js
```

## Module Descriptions

### Backend (FastAPI)
- **Routers**: 6 API route modules (projects, surveys, boreholes, processing, visualization, reports)
- **Models**: SQLAlchemy ORM with PostGIS geometry columns
- **Schemas**: Pydantic validation for all request/response payloads
- **Services**: File parsing (CSV, TXT, RES2DINV, OHM) and PDF report generation

### Scientific Engine
- **Data Loader**: Unified parser outputting NumPy arrays
- **Resistivity**: Geometric factor calculations for Wenner, Schlumberger, Dipole-Dipole
- **Mesh Utils**: Tensor (SimPEG) and unstructured (pyGIMLi) mesh generation
- **Runners**: SimPEG inversion and pyGIMLi ERT pipelines with demo fallbacks
- **Visualization Data**: Converts models to Plotly traces and Three.js mesh data

### Frontend (Next.js)
- **Pages**: Dashboard, Projects (list/detail), Surveys, Boreholes, Visualization Dashboard
- **Components**: Sidebar, TopBar, ProjectCard, FileUploader, EngineSelector, StatusBadge
- **Visualization**: ResistivityPlot (Plotly), SubsurfaceViewer (Three.js), SurveyMap (Leaflet), BoreholeLog
