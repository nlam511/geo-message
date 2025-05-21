from pydantic import BaseModel, EmailStr

class MessageInput(BaseModel):
    text: str
    latitude: float
    longitude: float 

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class RefreshRequest(BaseModel):
    token: str

class PushTokenRequest(BaseModel):
    push_token: str
