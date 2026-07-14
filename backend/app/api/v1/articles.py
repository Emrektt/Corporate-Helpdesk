from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse

router = APIRouter()

@router.get("/", response_model=List[ArticleResponse])
def get_articles(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Makaleleri listeler. Çalışanlar sadece yayında olanları görebilir."""
    query = db.query(Article)
    
    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(Article.is_published == True)
        
    if department_id:
        query = query.filter(Article.department_id == department_id)
        
    return query.order_by(Article.created_at.desc()).all()

@router.get("/search", response_model=List[ArticleResponse])
def search_articles(
    q: str = Query(..., min_length=3),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının girdiği kelimelere göre makale başlığı ve içeriğinde arama yapar.
    Sadece yayında olan makalelerde arar. Ticket Deflection için kullanılır.
    """
    search_term = f"%{q}%"
    
    query = db.query(Article).filter(
        Article.is_published == True,
        or_(
            Article.title.ilike(search_term),
            Article.content.ilike(search_term)
        )
    )
    
    return query.order_by(Article.view_count.desc()).limit(5).all()

@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Belirli bir makaleyi getirir ve okuma sayısını 1 artırır."""
    article = db.query(Article).filter(Article.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
        
    if current_user.role == UserRole.EMPLOYEE and not article.is_published:
        raise HTTPException(status_code=403, detail="Bu makaleyi görüntüleme yetkiniz yok")
        
    # Okuma sayısını artır
    article.view_count += 1
    db.commit()
    db.refresh(article)
    
    return article

@router.post("/", response_model=ArticleResponse, status_code=201)
def create_article(
    article_in: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yeni makale oluşturur. Sadece ADMIN ve SUPPORT_AGENT oluşturabilir."""
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Makale oluşturma yetkiniz yok")
        
    new_article = Article(
        title=article_in.title,
        content=article_in.content,
        department_id=article_in.department_id,
        is_published=article_in.is_published,
        created_by_id=current_user.id
    )
    
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article

@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article_in: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Makaleyi günceller."""
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Makale düzenleme yetkiniz yok")
        
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
        
    if article_in.title is not None:
        article.title = article_in.title
    if article_in.content is not None:
        article.content = article_in.content
    if article_in.department_id is not None:
        article.department_id = article_in.department_id
    if article_in.is_published is not None:
        article.is_published = article_in.is_published
        
    db.commit()
    db.refresh(article)
    return article

@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Makaleyi siler."""
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Makale silme yetkiniz yok")
        
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
        
    db.delete(article)
    db.commit()
    return {"message": "Makale başarıyla silindi"}
