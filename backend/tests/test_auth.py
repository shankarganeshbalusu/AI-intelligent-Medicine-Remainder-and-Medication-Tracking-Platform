def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["role"] == "patient"
    assert "id" in data
    assert "password_hash" not in data


def test_register_duplicate_user(client):
    # First registration
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    # Second registration with same email
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Jane Copy",
            "email": "jane@example.com",
            "password": "anotherpassword",
            "role": "caregiver"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_user(client):
    # Register first
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    
    # Successful login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "jane@example.com",
            "password": "strongpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "patient"
    assert data["email"] == "jane@example.com"
    
    # Failed login - incorrect password
    response_fail_pw = client.post(
        "/api/auth/login",
        json={
            "email": "jane@example.com",
            "password": "wrongpassword"
        }
    )
    assert response_fail_pw.status_code == 403
    
    # Failed login - incorrect email
    response_fail_email = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "strongpassword123"
        }
    )
    assert response_fail_email.status_code == 403


from app import models

def test_google_login_new_user(client):
    res = client.post(
        "/api/auth/google-login",
        json={"email": "google_new@gmail.com", "name": "Google New", "role": "patient"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "google_new@gmail.com"
    assert "access_token" in data
    assert data["role"] == "patient"


def test_google_login_existing_user(client):
    client.post(
        "/api/auth/register",
        json={"name": "Google Old", "email": "google_old@gmail.com", "password": "randompassword123", "role": "caregiver"}
    )
    res = client.post(
        "/api/auth/google-login",
        json={"email": "google_old@gmail.com", "name": "Google Old", "role": "caregiver"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "google_old@gmail.com"
    assert data["role"] == "caregiver"


def test_password_reset_flow(client, db):
    client.post(
        "/api/auth/register",
        json={"name": "Forgot User", "email": "forgot@example.com", "password": "originalpassword", "role": "patient"}
    )
    res = client.post("/api/auth/forgot-password", json={"email": "forgot@example.com"})
    assert res.status_code == 200
    
    reset_token = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.email == "forgot@example.com").first()
    assert reset_token is not None
    token = reset_token.token
    
    reset_res = client.post(
        "/api/auth/reset-password",
        json={"email": "forgot@example.com", "token": token, "new_password": "resetnewpassword123"}
    )
    assert reset_res.status_code == 200
    
    login_old = client.post("/api/auth/login", json={"email": "forgot@example.com", "password": "originalpassword"})
    assert login_old.status_code == 403
    
    login_new = client.post("/api/auth/login", json={"email": "forgot@example.com", "password": "resetnewpassword123"})
    assert login_new.status_code == 200

