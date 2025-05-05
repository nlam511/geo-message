from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models import User
from app.utils.auth import hash_password
from app.schemas import UserCreate

import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
def drop_message(payload: UserCreate, db: Session = Depends(get_db)):
    # Check to see if User Already Exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Add new user to DB
    new_user = User(
        id=uuid.uuid4(),
        email=payload.email,
        hashed_password=hash_password(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": str(new_user.id),
        "email": new_user.email,
        "message": "User registered successfully"
    }