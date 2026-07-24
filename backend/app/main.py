from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.api.v1 import auth, departments, tickets, analytics, notifications, articles, chat, events, canned_responses, users, user_preferences

from app.models.event import EventLog
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.api.v1.announcements import router as announcements_router


import traceback

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Ayarları (Frontend'den gelen isteklere izin vermek için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(user_preferences.router, prefix="/api/v1/user-preferences", tags=["User Preferences"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Departments"])
app.include_router(tickets.router, prefix="/api/v1/tickets", tags=["Tickets"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(articles.router, prefix="/api/v1/articles", tags=["Knowledge Base"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Live Chat"])
app.include_router(events.router, prefix="/api/v1/events", tags=["System Events"])
app.include_router(canned_responses.router, prefix="/api/v1/canned-responses", tags=["Canned Responses"])
app.include_router(announcements_router, prefix="/api/v1")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    db = SessionLocal()
    try:
        error_msg = str(exc)
        tb_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        print("GLOBAL ERROR HANDLER CAUGHT:", tb_str, flush=True)
        event = EventLog(
            level="ERROR",
            source="BACKEND",
            message=error_msg,
            stack_trace=tb_str
        )
        db.add(event)
        db.commit()
    except Exception:
        pass
    finally:
        db.close()
        
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucu içinde beklenmeyen bir hata oluştu."}
    )


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
    
