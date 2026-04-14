from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from models import Priority


class SendCodeRequest(BaseModel):
    email: EmailStr


class UserCreate(BaseModel):
    username: str = Field(min_length=3)
    email: EmailStr
    password: str = Field(min_length=6)
    code: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class PasswordReset(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=6)


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.low
    due_date: Optional[str] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    due_date: Optional[str] = None


class TodoResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: Priority
    due_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
