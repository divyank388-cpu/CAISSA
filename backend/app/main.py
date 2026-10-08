from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes.games.router import router as games_router
from app.api.routes.health.router import router as health_router

app = FastAPI(title="Chess Learning App")

app.include_router(health_router, prefix="/api")
app.include_router(games_router, prefix="/api")

# Serve the frontend from the same server so one command runs everything. Mounted last.
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
