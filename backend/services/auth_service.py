from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from typing import Any

from .storage_service import _connect, init_db


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def _verify_password(password: str, encoded: str) -> bool:
    try:
        salt_hex, digest_hex = encoded.split(":", 1)
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_user(name: str, email: str, password: str) -> dict[str, str]:
    init_db()
    normalized_email = email.strip().lower()
    timestamp = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (normalized_email,)).fetchone()
        if existing:
            raise ValueError("An account with this email already exists.")
        cursor = conn.execute(
            "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (name.strip(), normalized_email, _hash_password(password), timestamp),
        )
        return {"id": str(cursor.lastrowid), "name": name.strip(), "email": normalized_email}


def authenticate_user(email: str, password: str) -> dict[str, str] | None:
    init_db()
    with _connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
    if not row or not _verify_password(password, row["password_hash"]):
        return None
    return {"id": str(row["id"]), "name": row["name"], "email": row["email"]}


def create_session(user_id: str) -> str:
    init_db()
    token = secrets.token_urlsafe(32)
    timestamp = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", (token, user_id, timestamp))
    return token


def get_user_from_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    init_db()
    with _connect() as conn:
        row = conn.execute(
            "SELECT users.id, users.name, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?",
            (token,),
        ).fetchone()
    return dict(row) if row else None
