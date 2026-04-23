from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.sinhala_ocr_service import process_bilingual_certificate
from app.services.certificate_service import get_certificate_by_id
import os
import shutil
import uuid

router = APIRouter()

@router.post("/extract-sinhala/{certificate_id}")
def extract_sinhala(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Extract Sinhala text from an uploaded certificate"""

    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    if not cert.file_path or not os.path.exists(cert.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate file not found"
        )

    result = process_bilingual_certificate(cert.file_path)

    # Save mixed text to DB
    if result["success"] and result.get("mixed_text"):
        existing = cert.ocr_text or ""
        cert.ocr_text = existing + "\n\n[SINHALA OCR]\n" + result["mixed_text"]
        db.commit()

    return {
        "certificate_id": certificate_id,
        "sinhala_ocr_result": result
    }

@router.post("/extract-sinhala-upload")
async def extract_sinhala_from_upload(
    file: UploadFile = File(...)
):
    """Test Sinhala OCR with a direct upload"""

    temp_path = f"uploads/temp_sin_{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
    os.makedirs("uploads", exist_ok=True)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = process_bilingual_certificate(temp_path)

    if os.path.exists(temp_path):
        os.remove(temp_path)

    return {"sinhala_ocr_result": result}