from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from httpx import Response

from routers.oauth import oauth_states


# ─── Helpers ────────────────────────────────────────────────────


def _inject_state() -> str:
    """Insert a valid OAuth state into the in-memory store and return it."""
    state = "test-state-123"
    oauth_states[state] = datetime.now(timezone.utc) + timedelta(minutes=5)
    return state


def _mock_google_responses(userinfo: dict):
    """Return a side_effect function for httpx.AsyncClient that mocks Google OAuth."""
    async def _post(url, **kwargs):
        return Response(200, json={"access_token": "google-token-123"})

    async def _get(url, **kwargs):
        return Response(200, json=userinfo)

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(side_effect=_post)
    mock_client.get = AsyncMock(side_effect=_get)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


def _mock_github_responses(gh_user: dict, emails: list | None = None):
    """Return a mock httpx.AsyncClient that mocks GitHub OAuth."""
    async def _post(url, **kwargs):
        return Response(200, json={"access_token": "github-token-123"})

    call_count = 0

    async def _get(url, **kwargs):
        nonlocal call_count
        call_count += 1
        if "user/emails" in url:
            return Response(200, json=emails or [])
        return Response(200, json=gh_user)

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(side_effect=_post)
    mock_client.get = AsyncMock(side_effect=_get)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


# ─── Redirect tests ────────────────────────────────────────────


@patch("routers.oauth.GOOGLE_CLIENT_ID", "test-google-id")
def test_google_redirect(client):
    resp = client.get("/api/auth/google", follow_redirects=False)
    assert resp.status_code == 307
    assert "accounts.google.com" in resp.headers["location"]
    assert "test-google-id" in resp.headers["location"]


@patch("routers.oauth.GITHUB_CLIENT_ID", "test-github-id")
def test_github_redirect(client):
    resp = client.get("/api/auth/github", follow_redirects=False)
    assert resp.status_code == 307
    assert "github.com/login/oauth/authorize" in resp.headers["location"]
    assert "test-github-id" in resp.headers["location"]


def test_google_redirect_not_configured(client):
    resp = client.get("/api/auth/google")
    assert resp.status_code == 500
    assert "未配置" in resp.json()["detail"]


def test_github_redirect_not_configured(client):
    resp = client.get("/api/auth/github")
    assert resp.status_code == 500
    assert "未配置" in resp.json()["detail"]


# ─── Google callback tests ──────────────────────────────────────


def test_google_callback_new_user(client):
    state = _inject_state()
    mock_client = _mock_google_responses({
        "id": "google-user-001",
        "email": "alice@gmail.com",
        "name": "Alice",
    })

    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client):
        resp = client.get(
            f"/api/auth/google/callback?code=test-code&state={state}",
            follow_redirects=False,
        )

    assert resp.status_code == 307
    location = resp.headers["location"]
    assert "/oauth-callback?token=" in location

    # Verify user was created
    from tests.conftest import TestingSessionLocal
    import models
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.google_id == "google-user-001").first()
    assert user is not None
    assert user.email == "alice@gmail.com"
    assert user.username == "alice"
    assert user.hashed_password is None
    db.close()


def test_google_callback_existing_user(client):
    """If user already has google_id, don't create a duplicate."""
    # First login creates user
    state1 = _inject_state()
    mock_client = _mock_google_responses({
        "id": "google-user-002",
        "email": "bob@gmail.com",
        "name": "Bob",
    })
    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client):
        client.get(f"/api/auth/google/callback?code=c&state={state1}", follow_redirects=False)

    # Second login should find existing user
    state2 = "state-2"
    oauth_states[state2] = datetime.now(timezone.utc) + timedelta(minutes=5)
    mock_client2 = _mock_google_responses({
        "id": "google-user-002",
        "email": "bob@gmail.com",
        "name": "Bob",
    })
    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client2):
        resp = client.get(f"/api/auth/google/callback?code=c&state={state2}", follow_redirects=False)

    assert resp.status_code == 307
    assert "/oauth-callback?token=" in resp.headers["location"]

    # Only one user should exist
    from tests.conftest import TestingSessionLocal
    import models
    db = TestingSessionLocal()
    count = db.query(models.User).filter(models.User.google_id == "google-user-002").count()
    assert count == 1
    db.close()


def test_google_callback_email_linking(client, registered_user):
    """If Google email matches existing password user, link the account."""
    state = _inject_state()
    mock_client = _mock_google_responses({
        "id": "google-link-001",
        "email": "test@example.com",  # matches registered_user's email
        "name": "TestUser",
    })

    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client):
        resp = client.get(
            f"/api/auth/google/callback?code=c&state={state}",
            follow_redirects=False,
        )

    assert resp.status_code == 307

    # Verify the existing user got the google_id linked
    from tests.conftest import TestingSessionLocal
    import models
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == "test@example.com").first()
    assert user.google_id == "google-link-001"
    assert user.hashed_password is not None  # still has password
    db.close()


# ─── GitHub callback tests ──────────────────────────────────────


def test_github_callback_new_user(client):
    state = _inject_state()
    mock_client = _mock_github_responses({
        "id": 12345,
        "login": "charlie",
        "name": "Charlie",
        "email": "charlie@github.com",
    })

    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client):
        resp = client.get(
            f"/api/auth/github/callback?code=test-code&state={state}",
            follow_redirects=False,
        )

    assert resp.status_code == 307
    assert "/oauth-callback?token=" in resp.headers["location"]

    from tests.conftest import TestingSessionLocal
    import models
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.github_id == "12345").first()
    assert user is not None
    assert user.email == "charlie@github.com"
    db.close()


def test_github_callback_private_email(client):
    """GitHub user with private email - should fetch from /user/emails."""
    state = _inject_state()
    mock_client = _mock_github_responses(
        gh_user={"id": 67890, "login": "private_user", "name": "Private", "email": None},
        emails=[
            {"email": "secondary@example.com", "primary": False, "verified": True},
            {"email": "primary@example.com", "primary": True, "verified": True},
        ],
    )

    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client):
        resp = client.get(
            f"/api/auth/github/callback?code=c&state={state}",
            follow_redirects=False,
        )

    assert resp.status_code == 307

    from tests.conftest import TestingSessionLocal
    import models
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.github_id == "67890").first()
    assert user is not None
    assert user.email == "primary@example.com"
    db.close()


# ─── State validation tests ─────────────────────────────────────


def test_callback_invalid_state(client):
    resp = client.get("/api/auth/google/callback?code=c&state=bad-state")
    assert resp.status_code == 400
    assert "无效" in resp.json()["detail"]


def test_callback_expired_state(client):
    state = "expired-state"
    oauth_states[state] = datetime.now(timezone.utc) - timedelta(minutes=1)
    resp = client.get(f"/api/auth/google/callback?code=c&state={state}")
    assert resp.status_code == 400
    assert "过期" in resp.json()["detail"]


# ─── Login guard for OAuth-only users ────────────────────────────


def test_login_oauth_only_user(client):
    """OAuth-only user (no password) should get a clear error on password login."""
    # Create an OAuth-only user via Google callback
    state = _inject_state()
    mock_client = _mock_google_responses({
        "id": "oauth-only-001",
        "email": "oauthonly@gmail.com",
        "name": "OAuth Only",
    })
    with patch("routers.oauth.httpx.AsyncClient", return_value=mock_client):
        client.get(f"/api/auth/google/callback?code=c&state={state}", follow_redirects=False)

    # Try logging in with password
    resp = client.post("/api/auth/login", data={
        "username": "oauth_only",
        "password": "any-password",
    })
    assert resp.status_code == 400
    assert "第三方登录" in resp.json()["detail"]


def test_google_callback_error_param(client):
    """Google returns an error (user denied consent)."""
    resp = client.get("/api/auth/google/callback?error=access_denied", follow_redirects=False)
    assert resp.status_code == 307
    assert "error=" in resp.headers["location"]
