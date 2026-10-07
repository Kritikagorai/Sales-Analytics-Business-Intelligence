"""
main.py - FastAPI app yahan banti hai.

Local mein chalane ke liye (PowerShell, project ke root folder se):
    uvicorn backend_api.main:app --reload --port 8000
Phir browser mein kholo: http://localhost:8000/health
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_api.config import Settings, load_settings
from backend_api.db import Database
from backend_api.errors import register_error_handlers
from backend_api.routers import health

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def create_app(settings: Settings | None = None) -> FastAPI:
    """
    App banane ka function. Tests apni settings de sakte hain,
    warna .env / environment se settings li jaati hain.
    """
    settings = settings or load_settings()

    app = FastAPI(
        title="Sales Analytics API",
        description="Backend for the sales website. Upload a file, then see your results.",
        version="3.0.0",
    )
    app.state.settings = settings
    app.state.db = Database(settings)

    # CORS: sirf ALLOWED_ORIGINS wali websites (Vercel URL + localhost) hi call kar sakti hain.
    # "*" kabhi use nahi karte.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,  # hum cookies use nahi karte, session_id header mein jaayega
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Session-Id"],
    )

    register_error_handlers(app)

    # Routers (Step A2-A6 mein aur routers yahan judenge)
    app.include_router(health.router)

    return app


# uvicorn isi "app" ko chalata hai
app = create_app()
