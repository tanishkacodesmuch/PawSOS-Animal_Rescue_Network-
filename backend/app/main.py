import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth,
    reports,
    assignments,
    veterinary,
    admin,
    analytics,
    storage,
)

# Initialize database schema if running with direct database connection
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    # Will fail if database is not reachable at startup; logged gracefully
    print(f"[Database Init Warning]: Could not auto-create tables: {e}")

app = FastAPI(
    title="PawSOS — Animal Emergency & Rescue Network API",
    description="Production-ready FastAPI backend for emergency animal rescue coordination, verified dispatch, veterinary charts, and rescue analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api namespace
api_v1 = FastAPI(title="PawSOS v1 Sub-application")
api_v1.include_router(auth.router)
api_v1.include_router(reports.router)
api_v1.include_router(assignments.router)
api_v1.include_router(veterinary.router)
api_v1.include_router(admin.router)
api_v1.include_router(analytics.router)
api_v1.include_router(storage.router)
api_v1.include_router(test_mode.router)

# Mount both at /api and root for compatibility
app.mount("/api", api_v1)

# Also include directly on app for convenience
app.include_router(auth.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
app.include_router(veterinary.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(storage.router, prefix="/api")
app.include_router(test_mode.router, prefix="/api")

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "PawSOS Animal Emergency & Rescue Network API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "configured",
        "storage": "supabase-ready",
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
