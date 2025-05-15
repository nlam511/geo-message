from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from geoalchemy2 import Geography
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta

import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)

    # Main content
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    
    # Relationships
    # One-to-many: A user can drop many messages
    messages = relationship("Message", back_populates="owner")
    # Many-to-many (via CollectedMessage): A user can collect many messages
    collected_messages = relationship("CollectedMessage", back_populates="user")


class Message(Base):
    __tablename__ = "messages"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True, nullable=False, unique=True)

    # Foreign key relationship to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Main content
    text = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # Many-to-one: Each message belongs to one user (its "owner")
    owner = relationship("User", back_populates="messages")
    # Many-to-many (via CollectedMessage): A message can be collected by many users
    collected_by = relationship("CollectedMessage", back_populates="message")


class CollectedMessage(Base):
    __tablename__ = "collected_messages"

    # Primary Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), primary_key=True)

    # Main Content
    collected_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # Link back to the user who collected the message
    user = relationship("User", back_populates="collected_messages")
    # Link back to the message that was collected
    message = relationship("Message", back_populates="collected_by")

class HiddenMessage(Base):
    __tablename__ = "hidden_messages"

    # Primary Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), primary_key=True)

    # Main Content
    hidden_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # Link back to the user who hid the message
    user = relationship("User", backref="hidden_messages")
    # Link back to the message that was hidden?
    message = relationship("Message", backref="dismissed_by")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    # Primary Keys
    # The actual refresh token string (UUID). Used as the lookup key and sent to the client.
    token = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Main Content
    # Foreign key to the user who owns this refresh token.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Expiration datetime. Token becomes invalid after this.
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))

    # Relationships
    # ORM relationship to the User model. Allows access like `refresh_token.user`.
    user = relationship("User", backref="refresh_tokens")