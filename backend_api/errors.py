"""
errors.py - Har error ko aasan English message mein badalna.

User ko kabhi traceback ya technical error nahi dikhna chahiye.
Asli error sirf server ke log mein likha jaata hai (debug ke liye).
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("backend_api")

# HTTP status code ke hisaab se aasan English messages
FRIENDLY_MESSAGES = {
    400: "Something in your request is not right. Please check and try again.",
    401: "Please upload your sales file first.",
    403: "You are not allowed to do this.",
    404: "We could not find what you asked for.",
    405: "This action is not allowed here.",
    413: "Your file is too big.",
    422: "Some details in your request are missing or wrong.",
    429: "Too many requests. Please wait a little and try again.",
    500: "Something went wrong on our side. Please try again.",
    503: "We could not connect to the database. Please try again in a minute.",
}


class AppError(Exception):
    """
    Hamara apna error. Isme message pehle se aasan English mein hota hai.
    Jaise: raise AppError("Please upload your sales file first.", status_code=401)
    """

    def __init__(self, message: str, status_code: int = 400, code: str = "error", extra: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code  # frontend ke liye chhota sa naam, jaise "no_session"
        self.extra = extra or {}


class DatabaseUnavailable(AppError):
    """Jab MySQL (aur fallback bhi) na mile."""

    def __init__(self):
        super().__init__(FRIENDLY_MESSAGES[503], status_code=503, code="database_unavailable")


def _error_body(message: str, code: str, extra: dict | None = None) -> dict:
    """Har error ka JSON ek jaisa dikhe: {"ok": false, "error": {...}}"""
    body = {"ok": False, "error": {"code": code, "message": message}}
    if extra:
        body["error"].update(extra)
    return body


def register_error_handlers(app: FastAPI) -> None:
    """Saare error handlers app mein jodo."""

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content=_error_body(exc.message, exc.code, exc.extra))

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(request: Request, exc: StarletteHTTPException):
        message = FRIENDLY_MESSAGES.get(exc.status_code, FRIENDLY_MESSAGES[500])
        return JSONResponse(status_code=exc.status_code, content=_error_body(message, f"http_{exc.status_code}"))

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        # Asli detail log mein, user ko sirf aasan message
        logger.info("Validation error on %s: %s", request.url.path, exc.errors())
        return JSONResponse(status_code=422, content=_error_body(FRIENDLY_MESSAGES[422], "invalid_request"))

    @app.exception_handler(Exception)
    async def handle_unknown_error(request: Request, exc: Exception):
        # Traceback sirf server log mein jaata hai, user ko nahi
        logger.exception("Unexpected error on %s", request.url.path)
        return JSONResponse(status_code=500, content=_error_body(FRIENDLY_MESSAGES[500], "server_error"))
