from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ocr_service import process_certificate_file
from app.services.certificate_service import get_certificate_by_id
import os
import shutil
import uuid

router = APIRouter()

@router.post("/extract/{certificate_id}")
def extract_text(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Extract text from an already uploaded certificate"""
    
    # Get certificate from DB
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
    
    # Run OCR
    result = process_certificate_file(cert.file_path)
    
    # Save OCR text to database
    if result["success"]:
        cert.ocr_text = result["full_text"]
        db.commit()
    
    return {
        "certificate_id": certificate_id,
        "ocr_result": result
    }

@router.post("/extract-upload")
async def extract_from_upload(
    file: UploadFile = File(...)
):
    """Extract text from a directly uploaded file (for testing)"""
    
    # Save temp file
    temp_path = f"uploads/temp_{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
    os.makedirs("uploads", exist_ok=True)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run OCR
    result = process_certificate_file(temp_path)
    
    # Clean up temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    return {"ocr_result": result}