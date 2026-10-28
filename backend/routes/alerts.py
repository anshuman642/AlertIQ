from __future__ import annotations

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile

try:
    from ..models.alert import AlertRequest, RiskResult
    from ..services.ai_service import AIServiceError
    from ..services.risk_service import analyze_alert as evaluate_alert
    from ..services.storage_service import list_alerts, save_alert
    from ..models.auth import AuthResponse, LoginRequest, RegisterRequest
    from ..services.auth_service import authenticate_user, create_session, create_user, get_user_from_token
except ImportError:  # pragma: no cover - allows running as a script
    from models.alert import AlertRequest, RiskResult
    from services.ai_service import AIServiceError
    from services.risk_service import analyze_alert as evaluate_alert
    from services.storage_service import list_alerts, save_alert
    from models.auth import AuthResponse, LoginRequest, RegisterRequest
    from services.auth_service import authenticate_user, create_session, create_user, get_user_from_token

router = APIRouter()
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024


@router.get("/api/v1/status")
def status() -> dict[str, str]:
    return {"status": "ok", "service": "AlertIQ"}


def _current_user(authorization: str | None) -> dict:
    token = authorization.removeprefix("Bearer ").strip() if authorization else None
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


@router.post("/api/v1/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    try:
        user = create_user(payload.name, str(payload.email), payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return AuthResponse(token=create_session(user["id"]), user=user)


@router.post("/api/v1/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = authenticate_user(str(payload.email), payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return AuthResponse(token=create_session(user["id"]), user=user)


@router.get("/api/v1/history")
def history(limit: int = 10, authorization: str | None = Header(default=None)) -> list[dict]:
    user = _current_user(authorization)
    return list_alerts(limit=limit, user_id=str(user["id"]))


@router.post("/api/v1/analyze", response_model=RiskResult)
def analyze_alert(alert: AlertRequest, authorization: str | None = Header(default=None)) -> RiskResult:
    user = _current_user(authorization)
    try:
        result = evaluate_alert(alert)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    save_alert(alert, result, user_id=str(user["id"]))
    return result


@router.post("/api/v1/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    description: str = Form(""),
    authorization: str | None = Header(default=None),
) -> dict[str, str | int | bool | list[str]]:
    _current_user(authorization)
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, WEBP, or GIF image.")
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be smaller than 8 MB.")
    if not description.strip():
        return {
            "status": "needs_text",
            "filename": image.filename or "uploaded-image",
            "message": "Image received. Add the visible text or enable OCR to complete threat analysis.",
        }
    alert = AlertRequest(message=description, source="image")
    try:
        result = evaluate_alert(alert)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    save_alert(alert, result, user_id=str(_current_user(authorization)["id"]))
    return {
        "status": "analyzed",
        "filename": image.filename or "uploaded-image",
        **result.model_dump(),
    }
