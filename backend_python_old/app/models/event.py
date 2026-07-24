from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class EventLog(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, index=True)        # INFO, WARNING, ERROR, CRITICAL
    source = Column(String, index=True)       # FRONTEND, BACKEND, AUTH
    event_type = Column(String, index=True, nullable=True)   # LOGIN, LOGOUT, ERROR, PAGE_LOAD, API_CALL vs
    message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    
    # Kullanıcı bilgisi
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, nullable=True)       # user silinse de email kalsın
    user_name = Column(String, nullable=True)
    
    # Bağlantı bilgisi
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
