from fastapi import APIRouter

router = APIRouter(prefix="/announcements", tags=["Duyurular"])

@router.get("/")
def get_announcements():
    return [{"id": 1, "title": "Hoş Geldiniz", "content": "Sisteme hoş geldiniz."}]
