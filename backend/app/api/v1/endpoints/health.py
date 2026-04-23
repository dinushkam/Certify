from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from sqlalchemy import text
from app.services.blockchain_service import blockchain_service
import os

router = APIRouter()

@router.get("/")
def full_health_check(db: Session = Depends(get_db)):
    """Check health of all system components"""

    # Check database
    db_status = "connected"
    db_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "disconnected"
        db_error = str(e)

    # Check blockchain
    blockchain_status = "connected" if blockchain_service.is_connected() \
        else "disconnected"

    # Check OCR model
    ocr_status = "loaded"
    try:
        from app.services.ocr_service import reader
        if reader is None:
            ocr_status = "not loaded"
    except Exception:
        ocr_status = "not loaded"

    # Check uploads folder
    uploads_exist = os.path.exists("uploads")

    # Overall status
    all_ok = (
        db_status == "connected" and
        uploads_exist
    )

    return {
        "overall": "healthy" if all_ok else "degraded",
        "components": {
            "database": {
                "status": db_status,
                "error": db_error
            },
            "blockchain": {
                "status": blockchain_status,
                "account": blockchain_service.account
            },
            "ocr_model": {
                "status": ocr_status
            },
            "storage": {
                "status": "ok" if uploads_exist else "missing",
                "path": "uploads/"
            }
        }
    }