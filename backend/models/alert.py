from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class AlertRequest(BaseModel):
    message: Optional[str] = Field(default=None, description="User message or email body to assess")
    url: Optional[str] = Field(default=None, description="URL associated with the alert")
    email: Optional[str] = Field(default=None, description="Sender or account email involved")
    source: str = Field(default="unknown", description="Where the alert originated")

    @field_validator("message", "url", "email")
    @classmethod
    def strip_optional_strings(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None


class RiskResult(BaseModel):
    is_suspicious: bool
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    summary: str
    indicators: List[str]
    recommendations: List[str]
    source: str
