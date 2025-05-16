from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from geoalchemy2 import Geography
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from app.enums import SubscriptionTier
from app.tier_limits import DROP_LIMITS
from sqlalchemy import Enum as SQLAlchemyEnum


import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)

    # Authentication
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Stripe Subscription Info
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    subscription_status = Column(String, default="inactive")
    subscription_expires_at = Column(DateTime, nullable=True)

    subscription_tier = Column(SQLAlchemyEnum(SubscriptionTier), default=SubscriptionTier.FREE, nullable=False)


    # Daily drop tracking
    daily_drop_count = Column(Integer, default=0)
    last_drop_date = Column(DateTime, nullable=True)

    # Relationships
    # One-to-many: A user can drop many messages
    messages = relationship("Message", back_populates="owner")

    # Many-to-many (via CollectedMessage): A user can collect many messages
    collected_messages = relationship("CollectedMessage", back_populates="user")

    # Many-to-many (via HiddenMessage): A user can hide many messages
    hidden_messages = relationship("HiddenMessage", back_populates="user")

    # One-to-many: A user can have multiple refresh tokens
    refresh_tokens = relationship("RefreshToken", back_populates="user")


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

    # Many-to-many (via HiddenMessage): A message can be hidden by many users
    hidden_messages = relationship("HiddenMessage", back_populates="message")


class CollectedMessage(Base):
    __tablename__ = "collected_messages"

    # Composite primary key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), primary_key=True)

    # Metadata
    collected_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="collected_messages")
    message = relationship("Message", back_populates="collected_by")


class HiddenMessage(Base):
    __tablename__ = "hidden_messages"

    # Composite primary key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), primary_key=True)

    # Metadata
    hidden_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="hidden_messages")
    message = relationship("Message", back_populates="hidden_messages")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    # Token string used as primary key
    token = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key to owning user
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Expiration
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
