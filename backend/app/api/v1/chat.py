"""
WebSocket tabanlı Canlı Destek (Live Chat) API modülü.

Mimari:
- Her sohbet odasının (ChatRoom) bir ID'si var.
- Kullanıcılar /ws/chat/{room_id} adresine WS bağlantısı kurar.
- ConnectionManager tüm aktif bağlantıları tutar ve mesaj dağıtır.
- HTTP endpointleri oda oluşturma, mesaj geçmişi ve oda yönetimi için kullanılır.
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Optional
import json
from datetime import datetime, timezone

from app.core.database import get_db, SessionLocal
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.chat import ChatRoom, ChatMessage, ChatRoomStatus
import jwt

router = APIRouter()


# ─── WebSocket Bağlantı Yöneticisi ────────────────────────────────────────────

class ConnectionManager:
    """
    Aktif WebSocket bağlantılarını yönetir.
    rooms: { room_id: { user_id: WebSocket } }
    """
    def __init__(self):
        self.rooms: Dict[int, Dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int, user_id: int):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        self.rooms[room_id][user_id] = websocket

    def disconnect(self, room_id: int, user_id: int):
        if room_id in self.rooms:
            self.rooms[room_id].pop(user_id, None)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast_to_room(self, room_id: int, message: dict):
        """Odadaki tüm bağlı kullanıcılara mesaj gönderir."""
        if room_id in self.rooms:
            disconnected = []
            for uid, ws in self.rooms[room_id].items():
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.append(uid)
            for uid in disconnected:
                self.rooms[room_id].pop(uid, None)


manager = ConnectionManager()


# ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """WebSocket için token'dan kullanıcı bilgisi çeker. Hem yerel JWT hem MSAL destekler."""
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        # Önce yerel JWT'deki 'sub' alanına bak (email olarak saklanıyor)
        email = payload.get("sub")
        # 'sub' bir email değilse veya yoksa, MSAL alanlarına bak
        if not email or "@" not in str(email):
            email = payload.get("preferred_username") or payload.get("email")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None


def serialize_message(msg: ChatMessage) -> dict:
    return {
        "id": msg.id,
        "room_id": msg.room_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender.full_name if msg.sender else "Bilinmeyen",
        "sender_role": msg.sender.role.value if msg.sender else "EMPLOYEE",
        "content": msg.content,
        "is_system": msg.is_system,
        "created_at": msg.created_at.isoformat() if msg.created_at else datetime.now(timezone.utc).isoformat(),
    }


def serialize_room(room: ChatRoom) -> dict:
    return {
        "id": room.id,
        "status": room.status.value,
        "subject": room.subject,
        "user_id": room.user_id,
        "user_name": room.user.full_name if room.user else "",
        "agent_id": room.agent_id,
        "agent_name": room.agent.full_name if room.agent else None,
        "created_at": room.created_at.isoformat() if room.created_at else "",
        "message_count": len(room.messages),
        "last_message": serialize_message(room.messages[-1]) if room.messages else None,
    }


# ─── HTTP Endpointleri ────────────────────────────────────────────────────────

@router.post("/rooms", status_code=201)
def create_room(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcı için yeni bir sohbet odası açar. Zaten aktif odası varsa onu döner."""
    existing = db.query(ChatRoom).filter(
        ChatRoom.user_id == current_user.id,
        ChatRoom.status == ChatRoomStatus.ACTIVE
    ).first()
    if existing:
        return serialize_room(existing)

    room = ChatRoom(user_id=current_user.id, subject=subject)
    db.add(room)
    db.commit()
    db.refresh(room)

    # Hoş geldiniz sistem mesajı
    welcome = ChatMessage(
        room_id=room.id,
        sender_id=current_user.id,
        content="Merhaba! 👋 Destek ekibimize bağlandınız. En kısa sürede size yardımcı olacağız.",
        is_system=True
    )
    db.add(welcome)
    db.commit()
    db.refresh(room)
    return serialize_room(room)


@router.get("/rooms/my")
def get_my_room(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının aktif odasını getirir."""
    room = db.query(ChatRoom).filter(
        ChatRoom.user_id == current_user.id,
        ChatRoom.status == ChatRoomStatus.ACTIVE
    ).first()
    if not room:
        return None
    return serialize_room(room)


@router.get("/rooms")
def get_all_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin/Destek: Tüm aktif ve kapalı odaları getirir."""
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Yetki yetersiz")
    rooms = db.query(ChatRoom).order_by(ChatRoom.created_at.desc()).all()
    return [serialize_room(r) for r in rooms]


@router.get("/rooms/{room_id}/messages")
def get_room_messages(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bir odanın geçmiş mesajlarını getirir."""
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Oda bulunamadı")

    # Sadece odanın sahibi veya destek uzmanları mesajları görebilir
    if current_user.role == UserRole.EMPLOYEE and room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yetki yetersiz")

    msgs = db.query(ChatMessage).filter(ChatMessage.room_id == room_id).order_by(ChatMessage.created_at).all()
    return [serialize_message(m) for m in msgs]


@router.put("/rooms/{room_id}/close")
def close_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sohbeti kapatır."""
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Oda bulunamadı")
    if current_user.role == UserRole.EMPLOYEE and room.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yetki yetersiz")

    room.status = ChatRoomStatus.CLOSED
    room.closed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Sohbet kapatıldı"}


@router.put("/rooms/{room_id}/claim")
async def claim_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Destek uzmanı bir sohbet odasını üstlenir."""
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Yetki yetersiz")

    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Oda bulunamadı")

    room.agent_id = current_user.id
    db.commit()

    # Sistem mesajı olarak bildir
    sys_msg = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        content=f"{current_user.full_name} sohbete katıldı.",
        is_system=True
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(sys_msg)

    await manager.broadcast_to_room(room_id, {
        "type": "system",
        **serialize_message(sys_msg)
    })

    db.refresh(room)
    return serialize_room(room)


# ─── WebSocket Endpointi ──────────────────────────────────────────────────────

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    token: str = Query(...)
):
    """
    Gerçek zamanlı mesajlaşma WebSocket endpointi.
    Bağlanmak için: ws://localhost:8001/api/v1/chat/ws/{room_id}?token=<access_token>
    """
    db = SessionLocal()
    try:
        # Token doğrulama
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001, reason="Geçersiz token")
            return

        # Oda kontrolü
        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
        if not room:
            await websocket.close(code=4004, reason="Oda bulunamadı")
            return

        # Yetki kontrolü: kullanıcı kendi odası, destek ekibi her odaya girebilir
        if user.role == UserRole.EMPLOYEE and room.user_id != user.id:
            await websocket.close(code=4003, reason="Yetki yetersiz")
            return

        await manager.connect(websocket, room_id, user.id)

        # Geçmiş mesajları gönder
        history = db.query(ChatMessage).filter(
            ChatMessage.room_id == room_id
        ).order_by(ChatMessage.created_at).all()

        await websocket.send_json({
            "type": "history",
            "messages": [serialize_message(m) for m in history],
            "room": serialize_room(room)
        })

        # Mesaj döngüsü
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "message":
                content = payload.get("content", "").strip()
                if not content:
                    continue

                # Mesajı veritabanına kaydet
                msg = ChatMessage(
                    room_id=room_id,
                    sender_id=user.id,
                    content=content,
                    is_system=False
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                # Odadaki herkese yayınla
                await manager.broadcast_to_room(room_id, {
                    "type": "message",
                    **serialize_message(msg)
                })

            elif payload.get("type") == "typing":
                # Yazıyor... bilgisini yayınla (DB'ye kaydetme)
                await manager.broadcast_to_room(room_id, {
                    "type": "typing",
                    "user_id": user.id,
                    "sender_name": user.full_name,
                    "is_typing": payload.get("is_typing", False)
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, user.id if user else -1)
    except Exception as e:
        manager.disconnect(room_id, user.id if user else -1)
    finally:
        db.close()
