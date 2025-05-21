from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models import User, Message, CollectedMessage, RefreshToken, PushToken
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from app.schemas import UserCreate, LoginRequest, RefreshRequest, PushTokenRequest
from app.enums import SubscriptionTier
from app.tier_limits import DROP_LIMITS
from datetime import datetime, date
import random

import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEFAULT_AVATARS = [f"avatar{i}.jpeg" for i in range(1, 4)]  # avatar1 to avatar4

@router.post("/register")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Add new user to DB
    new_user = User(
        id=uuid.uuid4(),
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        profile_picture=random.choice(DEFAULT_AVATARS)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": str(new_user.id),
        "username": new_user.username,
        "email": new_user.email,
        "message": "User registered successfully"
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Generate an access token
    access_token = create_access_token(data={"sub": str(user.id)})

    # Generate a refresh token
    refresh_token = str(uuid.uuid4())
    db.add(RefreshToken(token=refresh_token, user_id=user.id))
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "username": user.username,
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

    # Get Remaining Drops Count
    try:
        tier = SubscriptionTier(current_user.subscription_tier)
    except ValueError:
        tier = SubscriptionTier.FREE
    drop_limit = DROP_LIMITS.get(tier, DROP_LIMITS[SubscriptionTier.FREE])

    # Reset drop count if it's a new day
    if not current_user.last_drop_date or current_user.last_drop_date.date() < date.today():
        drops_used = 0
    else:
        drops_used = current_user.daily_drop_count

    daily_drops_remaining = max(0, drop_limit - drops_used)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "messages_dropped": dropped_count,
        "messages_collected": collected_count,
        "daily_drops_remaining": daily_drops_remaining,
    }

@router.post("/push-token")
def save_push_token(
    payload: PushTokenRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not payload.push_token.startswith("ExponentPushToken["):
        raise HTTPException(status_code=400, detail="Invalid Expo push token")

    # Avoid duplicates
    existing = db.query(PushToken).filter(PushToken.token == payload.push_token).first()
    if existing:
        return {"status": "ok", "message": "Token already saved"}

    new_token = PushToken(user_id=user.id, token=payload.push_token)
    db.add(new_token)
    db.commit()
    return {"status": "success", "message": "Push token saved"}