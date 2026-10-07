"""
db.py - Database se judna (MySQL, aur local mode mein SQLite fallback).

Kaam kaise karta hai:
1. Pehle MySQL try karo (.env ki details se). Fail ho to kuch baar retry karo.
2. Phir bhi na mile:
   - local mode (APP_ENV=local) -> SQLite file use karo, taaki laptop par kaam chalta rahe.
   - production mode -> DatabaseUnavailable error (user ko aasan message milega).

Har query parameterized hai (%s placeholders), taaki SQL injection na ho sake.
SQL hamesha %s ke saath likho. SQLite ke liye ye apne aap ? mein badal jaata hai.
"""

import logging
import sqlite3
import ssl
import time
from contextlib import contextmanager
from pathlib import Path

import pymysql
import pymysql.cursors

from backend_api.config import Settings
from backend_api.errors import DatabaseUnavailable

logger = logging.getLogger("backend_api")


class Database:
    """Ek chhota wrapper jo MySQL ya SQLite dono ke saath ek jaisa kaam kare."""

    def __init__(self, settings: Settings):
        self.settings = settings
        # "mysql", "sqlite", ya None (abhi tak connect nahi hua)
        self.kind: str | None = None

    # ---------- MySQL ----------

    def _mysql_ssl(self):
        """Online MySQL ke liye SSL context banao (DB_SSL=true ho tab)."""
        if not self.settings.db_ssl:
            return None
        ca_file = self.settings.db_ssl_ca or None
        # CA file di hai to usse verify karo, warna system ke certificates use karo
        return ssl.create_default_context(cafile=ca_file)

    def _connect_mysql(self):
        """MySQL se connect karo, fail ho to DB_RETRIES baar dobara try karo."""
        s = self.settings
        last_error = None
        for attempt in range(1, s.db_retries + 1):
            try:
                return pymysql.connect(
                    host=s.db_host,
                    port=s.db_port,
                    user=s.db_user,
                    password=s.db_password,
                    database=s.db_name,
                    ssl=self._mysql_ssl(),
                    connect_timeout=5,
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=False,
                    charset="utf8mb4",
                )
            except pymysql.MySQLError as exc:
                last_error = exc
                # Password log mein kabhi nahi likhte, sirf host aur attempt number
                logger.warning("MySQL connect failed (attempt %s/%s, host=%s): %s",
                               attempt, s.db_retries, s.db_host, exc.__class__.__name__)
                if attempt < s.db_retries:
                    time.sleep(s.db_retry_seconds)
        raise ConnectionError(f"MySQL not reachable: {last_error.__class__.__name__}")

    # ---------- SQLite (sirf local fallback) ----------

    def _connect_sqlite(self):
        """Local SQLite file kholo. Folder na ho to bana do."""
        path = Path(self.settings.sqlite_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        return conn

    # ---------- Common ----------

    def _open(self):
        """Sahi database kholo aur (connection, kind) wapas do."""
        s = self.settings
        if s.mysql_configured:
            try:
                conn = self._connect_mysql()
                self.kind = "mysql"
                return conn, "mysql"
            except ConnectionError:
                if not s.is_local:
                    self.kind = None
                    raise DatabaseUnavailable()
                logger.warning("MySQL not available. Using local SQLite fallback.")
        elif not s.is_local:
            # Production mein MySQL ki details hi nahi di gayi
            logger.error("DB_HOST / DB_USER / DB_NAME are not set in production.")
            raise DatabaseUnavailable()

        try:
            conn = self._connect_sqlite()
        except sqlite3.Error:
            logger.exception("SQLite fallback also failed.")
            self.kind = None
            raise DatabaseUnavailable()
        self.kind = "sqlite"
        return conn, "sqlite"

    @contextmanager
    def connection(self):
        """
        'with db.connection() as (conn, kind):' likh kar use karo.
        Kaam theek hua to commit, error aaya to rollback, aur aakhir mein close.
        """
        conn, kind = self._open()
        try:
            yield conn, kind
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def _sql_for(kind: str, sql: str) -> str:
        """MySQL ka %s placeholder SQLite ke liye ? mein badlo."""
        return sql.replace("%s", "?") if kind == "sqlite" else sql

    def fetch_all(self, sql: str, params: tuple | list = ()) -> list[dict]:
        """SELECT chalao aur rows ko list of dict mein wapas do."""
        with self.connection() as (conn, kind):
            cur = conn.cursor()
            cur.execute(self._sql_for(kind, sql), tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def execute(self, sql: str, params: tuple | list = ()) -> int:
        """INSERT/UPDATE/DELETE chalao. Kitni rows badli, wo wapas do."""
        with self.connection() as (conn, kind):
            cur = conn.cursor()
            cur.execute(self._sql_for(kind, sql), tuple(params))
            return cur.rowcount

    def ping(self) -> str:
        """
        /health ke liye check: database chal raha hai ya nahi.
        Wapas deta hai "mysql", "sqlite" ya "unavailable".
        """
        try:
            self.fetch_all("SELECT 1 AS ok")
            return self.kind or "unavailable"
        except DatabaseUnavailable:
            return "unavailable"
        except Exception:
            logger.exception("Database ping failed.")
            return "unavailable"
