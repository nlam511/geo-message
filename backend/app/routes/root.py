from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def home():
    return {"message": "Geo-Message backend is running!!!"}