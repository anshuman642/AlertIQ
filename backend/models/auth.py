from pydantic import BaseModel, Field, field_validator


def _validate_email(value: str) -> str:
    normalized = value.strip().lower()
    if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
        raise ValueError("Enter a valid email address.")
    return normalized


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=8, max_length=128)

    _normalize_email = field_validator("email")(_validate_email)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)

    _normalize_email = field_validator("email")(_validate_email)


class AuthResponse(BaseModel):
    token: str
    user: dict[str, str]
