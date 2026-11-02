"""
PawSOS FastAPI Routers
"""
from app.routers import auth, reports, assignments, veterinary, admin, analytics, storage, test_mode

__all__ = [
    "auth",
    "reports",
    "assignments",
    "veterinary",
    "admin",
    "analytics",
    "storage",
    "test_mode",
]
