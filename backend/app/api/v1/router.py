from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, certificates, ocr,
    fraud, blockchain, health,
    sinhala_ocr, analytics,
    institution_requests,
    notifications, users
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
api_router.include_router(fraud.router, prefix="/fraud", tags=["Fraud Detection"])
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["Blockchain"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(sinhala_ocr.router, prefix="/sinhala-ocr", tags=["Sinhala OCR"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(institution_requests.router, prefix="/institution-requests", tags=["Institution Requests"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])