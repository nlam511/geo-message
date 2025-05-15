from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models import User, Message, CollectedMessage, RefreshToken
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from app.schemas import UserCreate, LoginRequest, RefreshRequest

import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
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


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Verify the login attempt
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create the access token
    token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email
    }

@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Find a refresh token for the current user
    token_entry = db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).first()

    if token_entry:
        db.delete(token_entry)
        db.commit()

    return {"status": "success", "message": "Logged out"}

@router.post("/refresh")
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token = payload.token

    # Lookup token
    entry = db.query(RefreshToken).filter_by(token=token).first()
    if not entry:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Check expiration
    if entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Expired refresh token")

    # Lookup user
    user = db.query(User).filter_by(id=entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Return new access token
    access_token = create_access_token(user)

    return {"access_token": access_token}

@router.get("/me")
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dropped_count = db.query(Message).filter(Message.user_id == current_user.id).count()
    collected_count = db.query(CollectedMessage).filter(CollectedMessage.user_id == current_user.id).count()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "messages_dropped": dropped_count,
        "messages_collected": collected_count,
    }