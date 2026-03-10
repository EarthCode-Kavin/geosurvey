"""
GeoSurvey Platform — Database Engine & Session
SQLAlchemy engine with PostGIS support. Falls back to SQLite for local dev.
"""

import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _build_engine():
    """Create the database engine, falling back to SQLite if PostgreSQL is unavailable."""
    db_url = settings.DATABASE_URL

    # If DATABASE_URL points to PostgreSQL, try to connect; fall back to SQLite
    if db_url.startswith("postgresql"):
        try:
            import psycopg2  # noqa: F401
            test_engine = create_engine(db_url, echo=False)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            test_engine.dispose()
        except Exception:
            # PostgreSQL not available — use SQLite fallback
            db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
            os.makedirs(db_dir, exist_ok=True)
            db_url = f"sqlite:///{os.path.join(db_dir, 'geosurvey.db')}"
            print(f"[WARN] PostgreSQL unavailable -- using SQLite: {db_url}")

    echo = settings.DEBUG and not db_url.startswith("sqlite")
    eng = create_engine(db_url, echo=echo)

    # Enable WAL mode for SQLite for better concurrency
    if db_url.startswith("sqlite"):
        @event.listens_for(eng, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return eng


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
