# Deployment Guide

## Docker Compose (Recommended)

### Prerequisites
- Docker Engine 20+
- Docker Compose v2+

### Quick Start

```bash
git clone https://github.com/your-org/geophysical-web.git
cd geophysical-web
docker-compose up --build
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js app |
| backend | 8000 | FastAPI server |
| scientific-engine | — | Celery worker |
| db | 5432 | PostgreSQL + PostGIS |
| redis | 6379 | Task queue |

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://geosurvey:geosurvey_secret@db:5432/geosurvey
REDIS_URL=redis://redis:6379/0
UPLOAD_DIR=/app/uploads
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Requires PostgreSQL with PostGIS running locally (or use `docker-compose up db redis`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Scientific Engine (without Docker)

The scientific engine modules are imported directly by the backend. SimPEG and pyGIMLi are optional — the runners fall back to demo data if not installed.

---

## Database Migrations

```bash
cd backend
alembic upgrade head      # Apply migrations
alembic revision --autogenerate -m "description"  # New migration
```

---

## Production Notes

- Use `npm run build` for the frontend production bundle
- Set `DEBUG=False` in backend configuration
- Use a proper database password and secret key
- Configure CORS origins for your domain
- Consider using Nginx as a reverse proxy
