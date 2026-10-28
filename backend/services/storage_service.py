from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from ..models.alert import AlertRequest, RiskResult
except ImportError:  # pragma: no cover - allows running as a script
    from models.alert import AlertRequest, RiskResult

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "alertiq.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                message TEXT,
                email TEXT,
                url TEXT,
                source TEXT,
                risk_score INTEGER,
                risk_level TEXT,
                summary TEXT,
                indicators TEXT,
                recommendations TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        alert_columns = {row["name"] for row in conn.execute("PRAGMA table_info(alerts)").fetchall()}
        if "user_id" not in alert_columns:
            conn.execute("ALTER TABLE alerts ADD COLUMN user_id INTEGER")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )


def save_alert(alert: AlertRequest, result: RiskResult, user_id: str | None = None) -> dict[str, Any]:
    init_db()
    timestamp = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO alerts (
                user_id, message, email, url, source, risk_score, risk_level, summary,
                indicators, recommendations, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                alert.message,
                alert.email,
                alert.url,
                alert.source,
                result.risk_score,
                result.risk_level,
                result.summary,
                json.dumps(result.indicators),
                json.dumps(result.recommendations),
                timestamp,
            ),
        )
        alert_id = cursor.lastrowid
    return {
        "id": alert_id,
        "message": alert.message,
        "email": alert.email,
        "url": alert.url,
        "source": alert.source,
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "summary": result.summary,
        "indicators": result.indicators,
        "recommendations": result.recommendations,
        "created_at": timestamp,
    }


def list_alerts(limit: int = 10, user_id: str | None = None) -> list[dict[str, Any]]:
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT *
            FROM alerts
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "message": row["message"],
            "email": row["email"],
            "url": row["url"],
            "source": row["source"],
            "risk_score": row["risk_score"],
            "risk_level": row["risk_level"],
            "summary": row["summary"],
            "indicators": json.loads(row["indicators"] or "[]"),
            "recommendations": json.loads(row["recommendations"] or "[]"),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


init_db()
