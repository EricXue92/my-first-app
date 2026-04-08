from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=List[schemas.TodoResponse])
def get_todos(
    completed: Optional[bool] = None,
    priority: Optional[models.Priority] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Todo).filter(models.Todo.user_id == current_user.id)
    if completed is not None:
        q = q.filter(models.Todo.completed == completed)
    if priority is not None:
        q = q.filter(models.Todo.priority == priority)
    return q.order_by(models.Todo.created_at.desc()).all()


@router.post("", response_model=schemas.TodoResponse, status_code=201)
def create_todo(
    todo_data: schemas.TodoCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = models.Todo(**todo_data.model_dump(), user_id=current_user.id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.get("/{todo_id}", response_model=schemas.TodoResponse)
def get_todo(
    todo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(
    todo_id: int,
    todo_data: schemas.TodoUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    for field, value in todo_data.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}/toggle", response_model=schemas.TodoResponse)
def toggle_todo(
    todo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.completed = not todo.completed
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(
    todo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
