from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models import User
from app.utils.auth import hash_password, verify_password, create_access_token
from app.schemas import UserCreate, LoginRequest

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
def logout(db: Session = Depends(get_db), current_user: Depends(get_current_user)):
    #TODO: Make sure you clear the access_token and refresh_token from the front end when you call this
    # Find the refresh token record
    token_entry = db.query(RefreshToken).filter_by(
        token=token,
        user_id=current_user.id
    ).first()

    if not token_entry:
        raise HTTPException(status_code=404, detail="Refresh token not found")

    # Remove the refresh token
    db.delete(token_entry)
    db.commit()

    return {"status": "success", "message": "Logged out"}

@router.post("/refresh")
def refresh_token(token: str, db: Session = Depends(get_db)):
    # Look up the token
    entry = db.query(RefreshToken).filter_by(token=token).first()
    if not entry:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Check expiration
    if entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Expired refresh token")

    # Load user
    user = db.query(User).filter_by(id=entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate new access token
    access_token = create_access_token(user)

    return {"access_token": access_token}