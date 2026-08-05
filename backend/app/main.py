from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.research import router as research_router
from app.db.database import Base, engine
from app.db import models  # noqa: F401

app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous Live Research & Data Synthesis Agent using LangGraph, Playwright, MCP, and FastAPI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize local database tables
Base.metadata.create_all(bind=engine)

# Include API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(research_router)


@app.get("/")
async def root():
    """Root metadata endpoint."""
    return {
        "name": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "api_v1_execute": "/api/v1/research/execute",
        "api_v1_stream": "/api/v1/research/stream",
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.APP_NAME} server on {settings.HOST}:{settings.PORT}")
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
