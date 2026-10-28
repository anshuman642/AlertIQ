import os

from pydantic import BaseModel, Field


class Settings(BaseModel):
    app_name: str = "AlertIQ"
    app_version: str = "1.0.0"
    description: str = "AI-Powered Platform for Scam, Fraud and Phishing Detection"
    openai_api_key: str | None = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    openai_model: str = Field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4o-mini"))


settings = Settings()
