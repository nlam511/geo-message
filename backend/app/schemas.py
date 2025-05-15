from pydantic import BaseModel, EmailStr

class MessageInput(BaseModel):
    text: str
    latitude: float
    longitude: float 

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    token: str