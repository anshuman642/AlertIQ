
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

try:
    from .config.settings import settings
    from .routes.alerts import router
except ImportError:
    from config.settings import settings
    from routes.alerts import router


# Initialize FastAPI application
app = FastAPI(
    title=settings.app_name + " API",
    description=settings.description,
    version=settings.app_version,
)


# Allow the React development server to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routes
app.include_router(router)


# Locate the frontend directory
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"


# Serve frontend files only if the directory exists
if frontend_dir.is_dir():
    app.mount(
        "/static",
        StaticFiles(directory=str(frontend_dir)),
        name="static",
    )


@app.get("/")
def home():
    index_file = frontend_dir / "index.html"

    if index_file.is_file():
        return FileResponse(index_file)

    return {
        "service": "AlertIQ Backend",
        "status": "running",
        "message": "Frontend is not served here. Run the React frontend separately.",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AlertIQ Backend",
        "version": settings.app_version,
    }
