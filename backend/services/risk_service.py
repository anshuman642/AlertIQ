from __future__ import annotations

import re
from urllib.parse import urlparse

try:
    from ..config.settings import settings
    from ..models.alert import AlertRequest, RiskResult
    from .ai_service import analyze_with_openai
except ImportError:  # pragma: no cover - allows running as a script
    from config.settings import settings
    from models.alert import AlertRequest, RiskResult
    from services.ai_service import analyze_with_openai

HIGH_RISK_KEYWORDS = {
    "urgent": 16,
    "immediately": 12,
    "verify": 12,
    "click here": 18,
    "suspended": 16,
    "security alert": 18,
    "limited time": 10,
    "act now": 12,
    "claim your reward": 20,
    "wire transfer": 18,
    "password expired": 20,
    "suspicious activity": 15,
    "bank account": 10,
    "invoice due": 10,
}

MEDIUM_RISK_KEYWORDS = {
    "urgent action": 10,
    "reset your password": 10,
    "login now": 10,
    "free money": 12,
    "click": 8,
    "confirm": 8,
    "update": 8,
    "secure": 7,
    "account": 6,
    "payment": 7,
    "prize": 12,
    "lottery": 12,
    "tax refund": 11,
    "fake invoice": 12,
    "document": 5,
    "registration fee": 22,
    "processing fee": 20,
    "pay the fee": 22,
    "pay ₹": 22,
    "pay rs": 20,
    "upi pin": 24,
    "one time password": 22,
    "otp": 18,
    "bank details": 16,
    "work from home": 12,
    "job offer": 12,
    "selected for": 10,
    "kyc update": 16,
    "cashback": 10,
    "investment return": 16,
    "double your money": 22,
    "इनाम": 16,
    "रजिस्ट्रेशन फीस": 24,
    "नौकरी के लिए फीस": 24,
    "ओटीपी": 20,
}

SUSPICIOUS_DOMAINS = ("bit.ly", "tinyurl.com", "goo.gl", "t.co", "dropbox.com")


def _coerce_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.lower().split())


def _detect_signal_score(text: str, url: str | None) -> tuple[int, list[str]]:
    score = 0
    indicators: list[str] = []

    if text:
        for keyword, weight in HIGH_RISK_KEYWORDS.items():
            if keyword in text:
                score += weight
                indicators.append(f"High-risk phrase detected: '{keyword}'")

        for keyword, weight in MEDIUM_RISK_KEYWORDS.items():
            if keyword in text:
                score += weight
                indicators.append(f"Moderate-risk phrase detected: '{keyword}'")

        if re.search(r"\b(?:\d{4,}|[A-Z]{4,})\b", text):
            score += 6
            indicators.append("Unusual code or number pattern in content")

    if url:
        normalized_url = url.lower()
        parsed = urlparse(url)
        if parsed.scheme == "http":
            score += 15
            indicators.append("URL uses HTTP instead of HTTPS")

        if any(domain in normalized_url for domain in SUSPICIOUS_DOMAINS):
            score += 20
            indicators.append(f"URL contains a shortening or suspicious domain: {url}")

        if "verify" in normalized_url or "secure" in normalized_url or "login" in normalized_url:
            score += 10
            indicators.append("URL contains login or verification language")

        if re.search(r"\d{3,}", parsed.netloc):
            score += 8
            indicators.append("URL hostname contains many numeric characters")

    return min(score, 100), indicators


def analyze_alert(alert: AlertRequest) -> RiskResult:
    if settings.openai_api_key:
        return analyze_with_openai(alert)

    text = _coerce_text(alert.message)
    email = _coerce_text(alert.email)
    url = _coerce_text(alert.url)
    combined_text = " ".join(part for part in [text, email, url] if part)

    score, indicators = _detect_signal_score(combined_text, alert.url)

    if not combined_text:
        score = 10
        indicators.append("No message, email, or URL was submitted for analysis")

    if alert.source and alert.source not in {"unknown"}:
        experts = {"sms", "email", "social", "chat", "web"}
        if alert.source.lower() in experts:
            score += 4
            indicators.append(f"Alert source '{alert.source}' may increase scrutiny")

    score = min(score, 100)

    if score >= 75:
        risk_level = "critical"
        summary = "This alert shows multiple indicators of a scam or phishing attempt."
        recommendations = [
            "Do not click the linked URL or open attached files.",
            "Verify the sender via a trusted contact method independent of the alert.",
            "Report the message to the relevant platform or security team."
        ]
    elif score >= 45:
        risk_level = "medium"
        summary = "The alert contains some suspicious features that warrant verification."
        recommendations = [
            "Review the message carefully before taking action.",
            "Contact the organization through official channels to validate the request.",
            "Avoid sharing sensitive details until the situation is confirmed."
        ]
    else:
        risk_level = "low"
        summary = "No major scam indicators were found in the submitted information."
        recommendations = [
            "Keep monitoring for follow-up messages or unusual requests.",
            "Use official verification channels when handling sensitive information."
        ]

    return RiskResult(
        is_suspicious=risk_level in {"medium", "critical"},
        risk_score=score,
        risk_level=risk_level,
        summary=summary,
        indicators=indicators or ["No high-confidence scam indicators were detected."],
        recommendations=recommendations,
        source=alert.source,
    )
