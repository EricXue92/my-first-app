from datetime import datetime, timedelta, timezone


def test_register_success(client):
    from routers.auth import pending_codes
    pending_codes["newuser@example.com"] = {
        "code": "111111",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    r = client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
        "code": "111111",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_username(client, registered_user):
    from routers.auth import pending_codes
    pending_codes["other@example.com"] = {
        "code": "222222",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    r = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "other@example.com",
        "password": "password123",
        "code": "222222",
    })
    assert r.status_code == 400
    assert "用户名已被注册" in r.json()["detail"]


def test_register_duplicate_email(client, registered_user):
    from routers.auth import pending_codes
    pending_codes["test@example.com"] = {
        "code": "333333",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    r = client.post("/api/auth/register", json={
        "username": "otheruser",
        "email": "test@example.com",
        "password": "password123",
        "code": "333333",
    })
    assert r.status_code == 400
    assert "该邮箱已被注册" in r.json()["detail"]


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


# --- Password Reset Tests ---


def test_send_reset_code_success(client, registered_user):
    from routers.auth import reset_codes
    r = client.post("/api/auth/send-reset-code", json={"email": "test@example.com"})
    assert r.status_code == 200
    assert r.json()["message"] == "验证码已发送，请查收邮件"
    assert "test@example.com" in reset_codes


def test_send_reset_code_unregistered(client):
    r = client.post("/api/auth/send-reset-code", json={"email": "nobody@example.com"})
    assert r.status_code == 400
    assert r.json()["detail"] == "该邮箱未注册"


def test_reset_password_success(client, registered_user):
    from routers.auth import reset_codes
    reset_codes["test@example.com"] = {
        "code": "123456",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    r = client.post("/api/auth/reset-password", json={
        "email": "test@example.com",
        "code": "123456",
        "new_password": "newpassword123",
    })
    assert r.status_code == 200
    assert r.json()["message"] == "密码重置成功，请重新登录"
    # New password works
    r = client.post("/api/auth/login", data={
        "username": "testuser",
        "password": "newpassword123",
    })
    assert r.status_code == 200
    # Old password fails
    r = client.post("/api/auth/login", data={
        "username": "testuser",
        "password": "testpassword123",
    })
    assert r.status_code == 401


def test_reset_password_wrong_code(client, registered_user):
    from routers.auth import reset_codes
    reset_codes["test@example.com"] = {
        "code": "123456",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    r = client.post("/api/auth/reset-password", json={
        "email": "test@example.com",
        "code": "999999",
        "new_password": "newpassword123",
    })
    assert r.status_code == 400
    assert r.json()["detail"] == "验证码错误"


def test_reset_password_expired(client, registered_user):
    from routers.auth import reset_codes
    reset_codes["test@example.com"] = {
        "code": "123456",
        "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    r = client.post("/api/auth/reset-password", json={
        "email": "test@example.com",
        "code": "123456",
        "new_password": "newpassword123",
    })
    assert r.status_code == 400
    assert r.json()["detail"] == "验证码已过期，请重新获取"


def test_reset_password_no_code(client, registered_user):
    r = client.post("/api/auth/reset-password", json={
        "email": "test@example.com",
        "code": "123456",
        "new_password": "newpassword123",
    })
    assert r.status_code == 400
    assert r.json()["detail"] == "请先获取验证码"


def test_reset_password_short_password(client, registered_user):
    from routers.auth import reset_codes
    reset_codes["test@example.com"] = {
        "code": "123456",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    r = client.post("/api/auth/reset-password", json={
        "email": "test@example.com",
        "code": "123456",
        "new_password": "short",
    })
    assert r.status_code == 422
