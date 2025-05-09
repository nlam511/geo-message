from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db_session import get_db
from app.models import Message, CollectedMessage
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

    return {
        "id": new_message.id,
         "message": "Message dropped successfully."
    }


@router.get("/nearby")
def nearby_messages(
    latitude: float = Query(...),
    longitude: float = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # TODO: Perhaps throw an error or redirect back to login when not authenticated.

    # Get Messages that the user already collected, so that it doesnt get populated on the map
    already_collected_msgs = (
        db.query(CollectedMessage.message_id)
        .filter(CollectedMessage.user_id == current_user.id)
        .subquery()
    )

    nearby_msgs = (
        db.query(Message)
        .filter(
            func.ST_DWithin(
                Message.location,
                func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
                100
            )
        )
        .filter(Message.id.notin_(already_collected_msgs))
        # TODO: Uncomment when ready
        # .filter(Message.user_id != current_user.id)
        .all()
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

@router.post("/{message_id}/collect")
def collect_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Get the message
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # TODO: Collecting own message makes it easy to developement/test so commenting this out.  Uncomment Later.
    # # Prevent collecting own message
    # if message.user_id == current_user.id:
    #     raise HTTPException(status_code=400, detail="You cannot collect your own message")

    # Check for duplicate collection
    already_collected = db.query(CollectedMessage).filter_by(
        user_id=current_user.id,
        message_id=message_id
    ).first()

    if already_collected:
        raise HTTPException(status_code=400, detail="You have already collected this message")

    # Insert collected message
    new_collection = CollectedMessage(
        user_id=current_user.id,
        message_id=message_id,
        collected_at=datetime.utcnow()
    )
    db.add(new_collection)
    db.commit()

    return {"status": "success", "message": "Message collected!"}


@router.get("collected")
def get_collected_messages(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Join CollectedMessages with Messages + Filter and Sort
    collected_msgs = (
        db.query(CollectedMessage)
        .join(Message)
        .filter(CollectedMessage.user_id == current_user.id)
        .order_by(desc(CollectedMessage.collected_at))
        .all()
    )
    print(len(collected_msgs))

    # Convert all CollectedMessages to JSON
    collected_json_msgs = []
    for msg in collected_msgs:
        collected_json_msgs.append({
            "id": msg.id,
            "text": msg.text,
            "longitude": to_shape(msg.location).x,
            "latitude": to_shape(msg.location).y,
            "created_at": msg.created_at,
            "collected_at": entry.collected_at,
        })

    return collected_json_msgs