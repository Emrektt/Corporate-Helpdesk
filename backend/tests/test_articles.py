from fastapi.testclient import TestClient
from app.models.article import Article
from app.models.department import Department

def test_create_article(client: TestClient, admin_token_headers, db):
    # Need a department first
    dept = Department(name="General")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    data = {
        "title": "How to reset password",
        "content": "Click the reset button...",
        "department_id": dept.id,
        "is_published": True
    }
    
    response = client.post("/api/v1/articles/", json=data, headers=admin_token_headers)
    assert response.status_code == 201
    assert response.json()["title"] == "How to reset password"

def test_get_articles(client: TestClient, user_token_headers, db, admin_user):
    # Create article directly
    dept = Department(name="IT")
    db.add(dept)
    db.commit()
    
    article = Article(
        title="VPN Setup", 
        content="...", 
        department_id=dept.id, 
        is_published=True,
        created_by_id=admin_user.id
    )
    db.add(article)
    db.commit()
    
    response = client.get("/api/v1/articles/", headers=user_token_headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
    
def test_search_articles(client: TestClient, user_token_headers, db, admin_user):
    dept = Department(name="IT")
    db.add(dept)
    db.commit()

    article = Article(
        title="Unique Keyword XYZ123", 
        content="...", 
        department_id=dept.id, 
        is_published=True,
        created_by_id=admin_user.id
    )
    db.add(article)
    db.commit()
    
    response = client.get("/api/v1/articles/search?q=XYZ123", headers=user_token_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["title"] == "Unique Keyword XYZ123"

def test_delete_article(client: TestClient, admin_token_headers, db, admin_user):
    dept = Department(name="IT")
    db.add(dept)
    db.commit()

    article = Article(
        title="To be deleted", 
        content="...", 
        department_id=dept.id, 
        is_published=True,
        created_by_id=admin_user.id
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.delete(f"/api/v1/articles/{article.id}", headers=admin_token_headers)
    assert response.status_code == 200
    
    deleted = db.query(Article).filter(Article.id == article.id).first()
    assert deleted is None

def test_delete_article_forbidden(client: TestClient, user_token_headers, db, admin_user):
    dept = Department(name="IT")
    db.add(dept)
    db.commit()

    article = Article(
        title="Cannot delete me", 
        content="...", 
        department_id=dept.id, 
        is_published=True,
        created_by_id=admin_user.id
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    
    response = client.delete(f"/api/v1/articles/{article.id}", headers=user_token_headers)
    assert response.status_code == 403
