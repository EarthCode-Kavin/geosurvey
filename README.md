
# 🌍 GeoSurvey Platform

### **The Ultimate Open-Source Web Platform for Geotechnical & Geophysical Survey Analysis.**
Integrating **SimPEG** and **pyGIMLi** for scientific computation with stunning, interactive **Plotly.js** visualizations and automated reporting.

## ✨ Features

The GeoSurvey Platform has been totally overhauled from a simple resistivity calculator into a massive, modular hub capable of hosting the entirety of the SimPEG scientific suite and beautiful geotechnical tracking.

### 🛰️ Geophysical Scientific Suite (SimPEG Integration)
Fully integrated frontend routing and data schema support for **15 Advanced Geophysical Methods** with proper citations:
- **Gravity:** 3D Forward Anomaly, 3D Gradiometry, 3D Inversion
- **Magnetics:** 3D TMI Forward, 3D Gradiometry Forward, 3D TMI Inversion
- **Direct Current (DC) Resistivity:** 1D, 2.5D, 3D Forward and Inversion
- **Induced Polarization (IP):** 2.5D, 3D Inversion
- **Electromagnetics (EM):** 1D FDEM Inversion, 1D TDEM Inversion
- **Joint & PGI:** Cross-gradient Joint Inversion, PGI Inversion

### 🔩 Geotechnical Borehole Dashboard
A robust visualization engine for all your drilling data:
- **Google Satellite Mapping:** Interactive Leaflet maps pinpointing your boreholes on HD satellite imagery.
- **Geological Cross-Sections:** Automatically scales physical Haversine distances to draw stacked, color-coded soil stratigraphic charts (using `react-plotly.js`).
- **Professional Log Sheets:** View a detailed single-borehole log complete with depth, elevation, automated SPT N-Value graphing, and colored USCS classifications.
- **Save as PDF:** Engineered CSS print styles strip away the app interface, generating seamless A4 geotechnical reports directly from the browser!

### 🎨 Clean, Minimalist UI & UX
- Completely redesigned with a warm, paper-like palette and elegant Serif typography (inspired by cutting-edge AI interfaces).
- **Dynamic Manual Data Entry:** Say goodbye to formatting `.csv` files! Select a geophysical method, and the built-in spreadsheet dynamically adapts its columns (e.g., switches to `x`, `y`, `z`, `tmi` for magnetics) making data entry flawless.

---

## 🚀 Future Updates on the Horizon
We are actively building to turn this platform into the industry gold standard:

- [ ] **Heavy Math Solvers:** Replacing the backend Celery runner "stubs" with the fully operational, high-performance SimPEG and pyGIMLi solver code.
- [ ] **3D Interactive Viewer:** Integrating `Three.js` (React Three Fiber) to render 3D inverted Earth models directly in the browser.
- [ ] **Advanced Cloud Reporting:** Server-side PDF generation using ReportLab combining maps, cross-sections, and tables into massive technical reports.
- [ ] **Auth & Org Workspaces:** Multi-tenant user authentication (NextAuth/JWT) for collaborative engineering teams.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                    │
│      TypeScript ✨ Tailwind CSS ✨ Plotly.js ✨ Leaflet.js        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Fast REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                     Backend (FastAPI)                           │
│           Models  │  Schemas  │  Routers  │  Celery             │
└──────┬─────────────────────────────────────────┬────────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐                    ┌─────────────────────────────┐
│  PostgreSQL  │                    │   Scientific Engine         │
│   + PostGIS  │                    │ SimPEG ✨ pyGIMLi ✨ NumPy  │
└──────────────┘                    └─────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, React-Plotly.js, Leaflet.js
- **Backend**: FastAPI, SQLAlchemy, GeoAlchemy2, Alembic
- **Database**: PostgreSQL + PostGIS extension
- **Scientific**: SimPEG, pyGIMLi, NumPy, SciPy
- **Infrastructure**: Docker Compose, Redis, Celery Workers

---

## 🚦 Quick Start

### Docker (Recommended)
Get the entire stack (Database, Backend, Frontend, Redis, Workers) running immediately:
```bash
git clone https://github.com/your-org/geophysical-web.git
cd geophysical-web
docker-compose up --build
```

- **Frontend Console:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Local Development
If you prefer running services directly:
```bash
# 1. Start your local PostgreSQL server

# 2. Start the Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Start the Frontend
cd frontend
npm install
npm run dev
```

> [!IMPORTANT]
> **Dependency Management**: The `node_modules` folder is **not** included in this repository to keep it lightweight. When you run `npm install`, Node.js automatically reads the `package.json` and downloads all necessary dependencies to your local machine.

---

## 📁 Project Structure

```text
geophysical_web/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── models/           # SQLAlchemy DB models 
│   │   ├── routers/          # API Endpoints
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Business logic
│   ├── alembic/              # Database migrations
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js 15 Application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components (Visualizations, UI)
│   │   └── lib/              # API clients and utilities
│   └── package.json          # Node dependencies
├── scientific-engine/        # Heavy Calculation Modules
│   ├── engine/
│   │   ├── simpeg_runner.py  # SimPEG integration (Gravity, Mag, IP, EM)
│   │   └── pygimli_runner.py # pyGIMLi integration (ERT)
│   └── requirements.txt      # Scientific dependencies
├── docs/                     # Additional documentation
├── docker-compose.yml        # Orchestration configuration
└── README.md                 # This file
```

---

## 🤝 Contributing
We love developers! Whether you're a geophysicist who writes Python or a UI/UX expert who writes React, there is a place for you here.
Check out our detailed [CONTRIBUTING.md](CONTRIBUTING.md) to get started!

## 📄 License
This platform is open-sourced under the **MIT License**. See the [LICENSE](LICENSE) file for details. Let's build the future of Geoscience together! 🚀
