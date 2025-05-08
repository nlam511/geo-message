from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db_session import get_db
from app.models import Message
from datetime import datetime
from app.utils.geo import calculate_distance
from app.utils.auth import get_current_user
from app.schemas import MessageInput
from geoalchemy2.shape import to_shape


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
    nearby_msgs = db.query(Message).filter(
        func.ST_DWithin(
            Message.location,
            func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
            100  # # arbitrary radius distance in meters
        )
    )

    nearby_msgs_json = []
    for msg in nearby_msgs:
        nearby_msgs_json.append({
            "id": msg.id,
            "user_id": msg.user_id,
            "text": msg.text,
            "longitude": to_shape(msg.location).x,
            "latitude": to_shape(msg.location).y,
            "created_at": msg.created_at,
        })

    return nearby_msgs_json
