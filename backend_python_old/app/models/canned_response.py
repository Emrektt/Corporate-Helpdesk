from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CannedResponse(Base):
    __tablename__ = "canned_responses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)          # Şablon adı (Ör: "Şifre sıfırlama")
    content = Column(String, nullable=False)                     # Şablon içeriği
    category = Column(String, nullable=True)                     # İsteğe bağlı kategori (Ör: "Genel", "Network")
    is_active = Column(Boolean, default=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # İlişkiler
    created_by = relationship("User", foreign_keys=[created_by_id])
