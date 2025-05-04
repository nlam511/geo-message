from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models import Message
from datetime import datetime
from app.utils.geo import calculate_distance

router = APIRouter(prefix="/message", tags=["Messages"])


class MessageInput(BaseModel):
    text: str
    latitude: float
    longitude: float 

@router.post("/drop")
def drop_message(payload: MessageInput, db: Session = Depends(get_db)):
    new_message = Message(
        text=payload.text,
        latitude=payload.latitude,
        longitude=payload.longitude,
        created_at=datetime.utcnow()
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return {"id": new_message.id, "message": "Message dropped successfully."}


@router.get("/nearby_messages")
def nearby_messages(
    latitude: float = Query(...),
    longitude: float = Query(...),
    db: Session = Depends(get_db)
):
    all_messages = db.query(Message).all()

    nearby_msgs = []
    for msg in all_messages:
        distance = calculate_distance(latitude, longitude, msg.latitude, msg.longitude)
        if distance <= 100:  # arbitrary radius distance
            nearby_msgs.append({
                "uuid": str(msg.uuid),
                "text": msg.text,
                "latitude": msg.latitude,
                "longitude": msg.longitude,
                "created_at": msg.created_at,
                "distance_meters": round(distance, 2)
            })

    return nearby_msgs
