def test_register_success(client):
    r = client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert r.status_code == 201
    data = r.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_username(client, registered_user):
    r = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "other@example.com",
        "password": "password123"
    })
    assert r.status_code == 400
    assert "Username already registered" in r.json()["detail"]


def test_register_duplicate_email(client, registered_user):
    r = client.post("/api/auth/register", json={
        "username": "otheruser",
        "email": "test@example.com",
        "password": "password123"
    })
    assert r.status_code == 400
    assert "Email already registered" in r.json()["detail"]


def test_login_success(client, registered_user):
    r = client.post("/api/auth/login", data={
        "username": "testuser",
        "password": "testpassword123"
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    r = client.post("/api/auth/login", data={
        "username": "testuser",
        "password": "wrongpassword"
    })
    assert r.status_code == 401


def test_get_me(client, auth_headers):
    r = client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["username"] == "testuser"


def test_get_me_no_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401
