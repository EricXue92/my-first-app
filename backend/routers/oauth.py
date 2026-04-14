import os
import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from routers.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["oauth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback"
)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/github/callback"
)

# In-memory state store for CSRF protection: { state: expires_at }
oauth_states: dict[str, datetime] = {}


def _generate_state() -> str:
    state = secrets.token_urlsafe(32)
    oauth_states[state] = datetime.now(timezone.utc) + timedelta(minutes=5)
    return state


def _validate_state(state: str | None) -> None:
    if not state or state not in oauth_states:
        raise HTTPException(status_code=400, detail="无效的 OAuth state")
    if datetime.now(timezone.utc) > oauth_states[state]:
        oauth_states.pop(state, None)
        raise HTTPException(status_code=400, detail="OAuth state 已过期")
    oauth_states.pop(state)


def _generate_username(base_name: str, db: Session) -> str:
    """Generate a unique username from the OAuth provider's name/login."""
    username = base_name.lower().replace(" ", "_")[:20]
    if not username:
        username = "user"
    if not db.query(models.User).filter(models.User.username == username).first():
        return username
    # Append random suffix on collision
    for _ in range(10):
        candidate = f"{username}_{secrets.token_hex(3)}"
        if not db.query(models.User).filter(models.User.username == candidate).first():
            return candidate
    return f"{username}_{secrets.token_hex(6)}"


def _find_or_create_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: str | None,
    display_name: str,
) -> models.User:
    """Look up user by OAuth ID, then by email, or create a new one."""
    provider_field = "google_id" if provider == "google" else "github_id"

    # 1. Lookup by provider ID
    user = (
        db.query(models.User)
        .filter(getattr(models.User, provider_field) == provider_id)
        .first()
    )
    if user:
        return user

    # 2. Lookup by email and link account
    if email:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            setattr(user, provider_field, provider_id)
            db.commit()
            db.refresh(user)
            return user

    # 3. Create new user
    username = _generate_username(display_name, db)
    user = models.User(
        username=username,
        email=email or f"{provider}_{provider_id}@oauth.local",
        hashed_password=None,
        **{provider_field: provider_id},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ─── Google OAuth ───────────────────────────────────────────────


@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth 未配置")
    state = _generate_state()
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + "&".join(
        f"{k}={v}" for k, v in params.items()
    )
    return RedirectResponse(url=url, status_code=307)


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/oauth-callback?error=Google 授权失败"
        )

    _validate_state(state)

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            return RedirectResponse(
                url=f"{FRONTEND_URL}/oauth-callback?error=Google token 交换失败"
            )
        tokens = token_resp.json()

        # Get user info
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            return RedirectResponse(
                url=f"{FRONTEND_URL}/oauth-callback?error=获取 Google 用户信息失败"
            )
        userinfo = userinfo_resp.json()

    user = _find_or_create_user(
        db=db,
        provider="google",
        provider_id=str(userinfo["id"]),
        email=userinfo.get("email"),
        display_name=userinfo.get("name", "google_user"),
    )
    jwt_token = create_access_token({"sub": user.username})
    return RedirectResponse(
        url=f"{FRONTEND_URL}/oauth-callback?token={jwt_token}", status_code=307
    )


# ─── GitHub OAuth ───────────────────────────────────────────────


@router.get("/github")
def github_login():
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth 未配置")
    state = _generate_state()
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email",
        "state": state,
    }
    url = "https://github.com/login/oauth/authorize?" + "&".join(
        f"{k}={v}" for k, v in params.items()
    )
    return RedirectResponse(url=url, status_code=307)


@router.get("/github/callback")
async def github_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/oauth-callback?error=GitHub 授权失败"
        )

    _validate_state(state)

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            return RedirectResponse(
                url=f"{FRONTEND_URL}/oauth-callback?error=GitHub token 交换失败"
            )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(
                url=f"{FRONTEND_URL}/oauth-callback?error=GitHub token 交换失败"
            )

        # Get user profile
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        user_resp = await client.get(
            "https://api.github.com/user", headers=auth_headers
        )
        if user_resp.status_code != 200:
            return RedirectResponse(
                url=f"{FRONTEND_URL}/oauth-callback?error=获取 GitHub 用户信息失败"
            )
        gh_user = user_resp.json()

        # If email is private, fetch from /user/emails
        email = gh_user.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails", headers=auth_headers
            )
            if emails_resp.status_code == 200:
                for entry in emails_resp.json():
                    if entry.get("primary") and entry.get("verified"):
                        email = entry["email"]
                        break

    user = _find_or_create_user(
        db=db,
        provider="github",
        provider_id=str(gh_user["id"]),
        email=email,
        display_name=gh_user.get("login", "github_user"),
    )
    jwt_token = create_access_token({"sub": user.username})
    return RedirectResponse(
        url=f"{FRONTEND_URL}/oauth-callback?token={jwt_token}", status_code=307
    )
