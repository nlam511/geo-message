from fastapi import APIRouter
from app.routes import root, message

router = APIRouter()
router.include_router(root.router)
router.include_router(message.router)