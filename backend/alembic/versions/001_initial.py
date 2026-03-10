"""Initial migration — create all tables

Revision ID: 001_initial
Revises: None
Create Date: 2026-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Projects table
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("client_name", sa.String(255), nullable=True),
        sa.Column("location_name", sa.String(500), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("status", sa.String(50), server_default="active"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    # PostGIS geometry column
    op.execute("SELECT AddGeometryColumn('projects', 'location', 4326, 'POINT', 2)")

    # Surveys table
    op.create_table(
        "surveys",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("array_type", sa.String(50), nullable=False),
        sa.Column("survey_type", sa.String(50), server_default="resistivity"),
        sa.Column("electrode_spacing", sa.Float(), nullable=True),
        sa.Column("num_electrodes", sa.Integer(), nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=True),
        sa.Column("file_path", sa.String(1000), nullable=True),
        sa.Column("file_format", sa.String(50), nullable=True),
        sa.Column("processing_status", sa.String(50), server_default="pending"),
        sa.Column("processing_engine", sa.String(50), nullable=True),
        sa.Column("processing_params", postgresql.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )

    # Boreholes table
    op.create_table(
        "boreholes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("elevation", sa.Float(), nullable=True),
        sa.Column("total_depth", sa.Float(), nullable=False),
        sa.Column("groundwater_depth", sa.Float(), nullable=True),
        sa.Column("drilling_method", sa.String(100), nullable=True),
        sa.Column("drilling_date", sa.DateTime(), nullable=True),
        sa.Column("soil_layers", postgresql.JSON(), nullable=True),
        sa.Column("spt_values", postgresql.JSON(), nullable=True),
        sa.Column("core_recovery", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.execute("SELECT AddGeometryColumn('boreholes', 'location', 4326, 'POINT', 2)")

    # Processing results table
    op.create_table(
        "processing_results",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("survey_id", sa.Integer(), sa.ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("engine_type", sa.String(50), nullable=False),
        sa.Column("processing_method", sa.String(100), nullable=True),
        sa.Column("result_data", postgresql.JSON(), nullable=True),
        sa.Column("model_data", postgresql.JSON(), nullable=True),
        sa.Column("rms_misfit", sa.Float(), nullable=True),
        sa.Column("chi_squared", sa.Float(), nullable=True),
        sa.Column("iterations", sa.Integer(), nullable=True),
        sa.Column("output_files", postgresql.JSON(), nullable=True),
        sa.Column("plot_data", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("processing_duration_seconds", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("processing_results")
    op.drop_table("boreholes")
    op.drop_table("surveys")
    op.drop_table("projects")
