from pydantic import BaseModel, EmailStr

class MessageInput(BaseModel):
    text: str
    latitude: float
    longitude: float 


class UserCreate(BaseModel):
    email: EmailStr
    password: str