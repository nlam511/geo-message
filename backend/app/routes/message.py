from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db_session import get_db
from app.models import Message
from datetime import datetime
from app.utils.geo import calculate_distance
from app.utils.auth import get_current_user
from app.schemas import MessageInput

router = APIRouter(prefix="/message", tags=["Messages"])


@router.post("/drop")
def drop_message(payload: MessageInput, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_message = Message(
        text=payload.text,
        user_id=current_user.id,
        longitude=payload.longitude,
        latitude=payload.latitude,
        location=func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326),
        created_at=datetime.utcnow()
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {"id": new_message.id, "message": "Message dropped successfully."}


@router.get("/nearby")
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
                "id": msg.id,
                "user_id": msg.user_id,
                "text": msg.text,
                "longitude": msg.longitude,
                "latitude": msg.latitude,
                "created_at": msg.created_at,
                "distance_meters": round(distance, 2)
            })

    return nearby_msgs
