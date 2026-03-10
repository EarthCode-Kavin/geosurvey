"""
GeoSurvey Scientific Engine — Celery Worker
Asynchronous task runner for long-running geophysical computations.
"""

import os

from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery("geosurvey-engine", broker=redis_url, backend=redis_url)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600 * 24,  # 24 hours
)


@app.task(bind=True, name="engine.run_processing")
def run_processing_task(self, survey_id: int, engine: str, file_path: str,
                        file_format: str, array_type: str, params: dict | None = None):
    """
    Celery task for running geophysical processing asynchronously.

    Args:
        survey_id: Database ID of the survey.
        engine: 'simpeg' or 'pygimli'.
        file_path: Path to the survey data file.
        file_format: Format string.
        array_type: Electrode array type.
        params: Optional processing parameters.
    """
    self.update_state(state="PROCESSING", meta={"survey_id": survey_id, "engine": engine})

    try:
        if engine == "simpeg":
            from engine.simpeg_runner import SimpegInversionRunner
            runner = SimpegInversionRunner()
        elif engine == "pygimli":
            from engine.pygimli_runner import PyGIMLiModellingRunner
            runner = PyGIMLiModellingRunner()
        else:
            raise ValueError(f"Unknown engine: {engine}")

        result = runner.run(
            file_path=file_path,
            file_format=file_format,
            array_type=array_type,
            params=params or {},
        )

        return {
            "survey_id": survey_id,
            "engine": engine,
            "status": "completed",
            "result": result,
        }

    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise
