from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from geoalchemy2 import Geography
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

import uuid

Base = declarative_base()

class Message(Base):
    __tablename__ = "messages"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, nullable=False, unique=True)

    # Foreign key relationship to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner = relationship("User", backref="messages")

    # Main content
    text = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    test = Column(String)
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)

    # Main content
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)