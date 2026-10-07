"""
health.py - GET /health

Frontend aur Render/Railway is endpoint se check karte hain ki server jaag raha hai ya nahi.
Isme koi user data nahi hota.
"""

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request):
    """Server aur database ki haalat batao."""
    db = request.app.state.db
    database = db.ping()
    return {
        "ok": True,
        "status": "running",
        "database": database,  # "mysql", "sqlite" ya "unavailable"
        "message": "The server is running." if database != "unavailable"
        else "The server is running, but the database is not reachable right now.",
    }
