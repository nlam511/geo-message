from fastapi import APIRouter
from app.routes import root, message, auth

router = APIRouter()
router.include_router(root.router)
router.include_router(message.router)
router.include_router(auth.router)