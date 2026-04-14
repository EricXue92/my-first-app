import os
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory store: { email: { code, expires_at } }
pending_codes: dict = {}
reset_codes: dict = {}

def _get_mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
        MAIL_FROM=os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", "noreply@example.com")),
        MAIL_PORT=int(os.getenv("MAIL_PORT", "465")),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=False,
        MAIL_SSL_TLS=True,
        USE_CREDENTIALS=bool(os.getenv("MAIL_USERNAME", "")),
    )


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise exc
    except JWTError:
        raise exc
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise exc
    return user


async def _send_verification_email(email: str, code: str):
    """Send verification code via email. Logs to console if MAIL_USERNAME is not configured."""
    if not os.getenv("MAIL_USERNAME"):
        print(f"[DEV] Verification code for {email}: {code}")
        return
    message = MessageSchema(
        subject="【TodoApp】邮箱验证码",
        recipients=[email],
        body=f"您的验证码是：{code}\n\n验证码 10 分钟内有效，请勿泄露给他人。",
        subtype=MessageType.plain,
    )
    fm = FastMail(_get_mail_config())
    await fm.send_message(message)


async def _send_reset_email(email: str, code: str):
    """Send password reset code via email."""
    if not os.getenv("MAIL_USERNAME"):
        print(f"[DEV] Reset code for {email}: {code}")
        return
    message = MessageSchema(
        subject="【TodoApp】密码重置验证码",
        recipients=[email],
        body=f"您的密码重置验证码是：{code}\n\n验证码 10 分钟内有效，请勿泄露给他人。",
        subtype=MessageType.plain,
    )
    fm = FastMail(_get_mail_config())
    await fm.send_message(message)


@router.post("/send-code")
async def send_code(
    request: schemas.SendCodeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = request.email
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    code = "".join(random.choices(string.digits, k=6))
    pending_codes[email] = {
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    background_tasks.add_task(_send_verification_email, email, code)
    return {"message": "验证码已发送，请查收邮件"}


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verify code
    entry = pending_codes.get(user_data.email)
    if not entry:
        raise HTTPException(status_code=400, detail="请先获取验证码")
    if datetime.now(timezone.utc) > entry["expires_at"]:
        pending_codes.pop(user_data.email, None)
        raise HTTPException(status_code=400, detail="验证码已过期，请重新获取")
    if entry["code"] != user_data.code:
        raise HTTPException(status_code=400, detail="验证码错误")

    # Check duplicates
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="用户名已被注册")
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    pending_codes.pop(user_data.email, None)
    return user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该账号通过第三方登录，请使用 Google 或 GitHub 登录",
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/send-reset-code")
async def send_reset_code(
    request: schemas.SendCodeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = request.email
    if not db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="该邮箱未注册")

    code = "".join(random.choices(string.digits, k=6))
    reset_codes[email] = {
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    background_tasks.add_task(_send_reset_email, email, code)
    return {"message": "验证码已发送，请查收邮件"}


@router.post("/reset-password")
def reset_password(data: schemas.PasswordReset, db: Session = Depends(get_db)):
    entry = reset_codes.get(data.email)
    if not entry:
        raise HTTPException(status_code=400, detail="请先获取验证码")
    if datetime.now(timezone.utc) > entry["expires_at"]:
        reset_codes.pop(data.email, None)
        raise HTTPException(status_code=400, detail="验证码已过期，请重新获取")
    if entry["code"] != data.code:
        raise HTTPException(status_code=400, detail="验证码错误")

    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="用户不存在")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    reset_codes.pop(data.email, None)
    return {"message": "密码重置成功，请重新登录"}
