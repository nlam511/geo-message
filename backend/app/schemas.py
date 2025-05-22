from pydantic import BaseModel, EmailStr,  Field, validator
import re

class MessageInput(BaseModel):
    text: str
    latitude: float
    longitude: float 

class UserCreate(BaseModel):
    username: str = Field(..., max_length=20)
    email: EmailStr
    password: str

    @validator("username")
    def username_must_be_alphanumeric(cls, v):
        # Allows letters, digits, underscore only
        if not re.fullmatch(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError("Username can only contain letters, numbers, and underscores.")
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

class RefreshRequest(BaseModel):
    token: str

class PushTokenRequest(BaseModel):
    push_token: str
