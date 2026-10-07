"""
config.py - Saari settings yahan .env file / environment variables se padhi jaati hain.

Koi password ya secret is file mein likha NAHI hai. Sab kuch os.environ se aata hai.
Local mein backend_api/.env file banao (.env.example copy karke).
Online (Render/Railway) par ye values dashboard ke "Environment" section mein daalni hain.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# backend_api/ folder ka path
BASE_DIR = Path(__file__).resolve().parent

# backend_api/.env ko load karo (agar hai). override=False ka matlab:
# jo variable pehle se environment mein set hai (jaise Render par), wahi jeetega.
load_dotenv(BASE_DIR / ".env", override=False)


def _get_bool(name: str, default: bool) -> bool:
    """Env variable ko True/False mein badlo ("true", "1", "yes" = True)."""
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def _get_int(name: str, default: int) -> int:
    """Env variable ko number mein badlo. Galat value ho to default use karo."""
    value = os.getenv(name)
    try:
        return int(value) if value not in (None, "") else default
    except ValueError:
        return default


def _get_list(name: str) -> list[str]:
    """Comma se alag values ko list banao. Jaise "a.com, b.com" -> ["a.com", "b.com"]."""
    value = os.getenv(name, "")
    # Aakhri "/" hata do, kyunki browser origin mein "/" nahi bhejta
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


@dataclass
class Settings:
    """App ki saari settings ek jagah."""

    # "local" = laptop par (SQLite fallback chalega), "production" = online server
    app_env: str = "local"

    # CORS: sirf in websites ko backend call karne ki permission hai
    allowed_origins: list[str] = field(default_factory=list)

    # MySQL connection ki details (sirf backend ke paas)
    db_host: str = ""
    db_port: int = 3306
    db_user: str = ""
    db_password: str = ""
    db_name: str = ""
    db_ssl: bool = False
    db_ssl_ca: str = ""  # online MySQL (Aiven) ka CA certificate file path, optional
    db_retries: int = 3
    db_retry_seconds: int = 2

    # MySQL na mile to local mode mein SQLite file use hogi
    sqlite_path: str = str(BASE_DIR / "local_data" / "uploads.db")

    # Upload aur privacy settings (Step A2 mein use hongi)
    max_upload_mb: int = 20
    expiry_hours: int = 24

    @property
    def is_local(self) -> bool:
        return self.app_env.lower() == "local"

    @property
    def mysql_configured(self) -> bool:
        """MySQL ki basic details di gayi hain ya nahi."""
        return bool(self.db_host and self.db_user and self.db_name)


def load_settings() -> Settings:
    """Environment se fresh settings banao. Tests mein bhi yahi call hota hai."""
    return Settings(
        app_env=os.getenv("APP_ENV", "local"),
        allowed_origins=_get_list("ALLOWED_ORIGINS"),
        db_host=os.getenv("DB_HOST", ""),
        db_port=_get_int("DB_PORT", 3306),
        db_user=os.getenv("DB_USER", ""),
        db_password=os.getenv("DB_PASSWORD", ""),
        db_name=os.getenv("DB_NAME", ""),
        db_ssl=_get_bool("DB_SSL", False),
        db_ssl_ca=os.getenv("DB_SSL_CA", ""),
        db_retries=max(1, _get_int("DB_RETRIES", 3)),
        db_retry_seconds=max(0, _get_int("DB_RETRY_SECONDS", 2)),
        sqlite_path=os.getenv("SQLITE_PATH", str(BASE_DIR / "local_data" / "uploads.db")),
        max_upload_mb=max(1, _get_int("MAX_UPLOAD_MB", 20)),
        expiry_hours=max(1, _get_int("EXPIRY_HOURS", 24)),
    )
