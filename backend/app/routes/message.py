from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models import Message
from datetime import datetime

router = APIRouter(prefix="/message", tags=["Messages"])

@router.post("/drop")
def drop_message(text: str, latitude: float, longitude: float, db: Session = Depends(get_db)):
    new_message = Message(
        text=text,
        latitude=latitude,
        longitude=longitude,
        created_at=datetime.utcnow()
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return {"id": new_message.id, "message": "Message dropped successfully."}