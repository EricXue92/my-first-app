def test_create_todo(client, auth_headers):
    r = client.post("/api/todos", json={
        "title": "Buy groceries",
        "priority": "high",
        "due_date": "2026-04-15"
    }, headers=auth_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Buy groceries"
    assert data["priority"] == "high"
    assert data["completed"] == False
    assert data["due_date"] == "2026-04-15"


def test_get_todos(client, auth_headers):
    client.post("/api/todos", json={"title": "Task 1"}, headers=auth_headers)
    client.post("/api/todos", json={"title": "Task 2"}, headers=auth_headers)
    r = client.get("/api/todos", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_todos_filter_completed(client, auth_headers):
    t = client.post("/api/todos", json={"title": "Task 1"}, headers=auth_headers).json()
    client.post("/api/todos", json={"title": "Task 2"}, headers=auth_headers)
    client.patch(f"/api/todos/{t['id']}/toggle", headers=auth_headers)

    r = client.get("/api/todos?completed=true", headers=auth_headers)
    assert len(r.json()) == 1
    assert r.json()[0]["completed"] == True


def test_get_todos_filter_priority(client, auth_headers):
    client.post("/api/todos", json={"title": "High", "priority": "high"}, headers=auth_headers)
    client.post("/api/todos", json={"title": "Low", "priority": "low"}, headers=auth_headers)
    r = client.get("/api/todos?priority=high", headers=auth_headers)
    assert len(r.json()) == 1
    assert r.json()[0]["title"] == "High"


def test_update_todo(client, auth_headers):
    t = client.post("/api/todos", json={"title": "Old title"}, headers=auth_headers).json()
    r = client.put(f"/api/todos/{t['id']}", json={"title": "New title", "priority": "low"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "New title"
    assert r.json()["priority"] == "low"


def test_toggle_todo(client, auth_headers):
    t = client.post("/api/todos", json={"title": "Task"}, headers=auth_headers).json()
    assert t["completed"] == False

    r = client.patch(f"/api/todos/{t['id']}/toggle", headers=auth_headers)
    assert r.json()["completed"] == True

    r = client.patch(f"/api/todos/{t['id']}/toggle", headers=auth_headers)
    assert r.json()["completed"] == False


def test_delete_todo(client, auth_headers):
    t = client.post("/api/todos", json={"title": "To delete"}, headers=auth_headers).json()
    r = client.delete(f"/api/todos/{t['id']}", headers=auth_headers)
    assert r.status_code == 204

    r = client.get(f"/api/todos/{t['id']}", headers=auth_headers)
    assert r.status_code == 404


def test_cannot_access_other_users_todo(client, auth_headers):
    t = client.post("/api/todos", json={"title": "Private"}, headers=auth_headers).json()

    client.post("/api/auth/register", json={
        "username": "other", "email": "other@example.com", "password": "pass123"
    })
    login = client.post("/api/auth/login", data={"username": "other", "password": "pass123"})
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    r = client.get(f"/api/todos/{t['id']}", headers=other_headers)
    assert r.status_code == 404


def test_get_todos_requires_auth(client):
    r = client.get("/api/todos")
    assert r.status_code == 401
