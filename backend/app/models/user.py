from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPPORT_AGENT = "SUPPORT_AGENT"
    EMPLOYEE = "EMPLOYEE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    entra_object_id = Column(String, unique=True, index=True, nullable=True) # Microsoft Entra ID
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # İlişkiler
    department = relationship("Department", back_populates="users")
    created_tickets = relationship("Ticket", foreign_keys="[Ticket.created_by_id]", back_populates="creator")
    assigned_tickets = relationship("Ticket", foreign_keys="[Ticket.assigned_to_id]", back_populates="assignee")
    comments = relationship("TicketComment", back_populates="user")
    history_actions = relationship("TicketHistory", back_populates="actor")
    notifications = relationship("Notification", back_populates="recipient")
