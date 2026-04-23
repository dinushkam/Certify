import uuid
import os
import shutil
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.models.certificate import Certificate
from app.services.qr_service import generate_qr_code

UPLOAD_FOLDER = "uploads/certificates"

def generate_certificate_id() -> str:
    return f"CERT-{uuid.uuid4().hex[:12].upper()}"

def save_uploaded_file(file: UploadFile, certificate_id: str) -> str:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    file_path = f"{UPLOAD_FOLDER}/{certificate_id}{ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

def create_certificate(
    db: Session,
    holder_name: str,
    institution_name: str,
    course_name: str,
    issue_date: str,
    expiry_date: str,
    file: UploadFile,
    uploaded_by: int,
    holder_email: str = None
) -> Certificate:

    certificate_id = generate_certificate_id()
    file_path = save_uploaded_file(file, certificate_id)
    qr_path = generate_qr_code(certificate_id)

    ocr_text = ""
    try:
        from app.services.ocr_service import process_certificate_file
        ocr_result = process_certificate_file(file_path)
        if ocr_result["success"]:
            ocr_text = ocr_result["full_text"]
    except Exception as e:
        print(f"OCR failed: {e}")

    db_cert = Certificate(
    certificate_id=certificate_id,
    holder_name=holder_name,
    holder_email=holder_email,
    institution_name=institution_name,
    institution_id=uploaded_by,  # ✅ Link by ID
    course_name=course_name,
    issue_date=issue_date,
    expiry_date=expiry_date if expiry_date else None,
    file_path=file_path,
    qr_code_path=qr_path,
    ocr_text=ocr_text if ocr_text else None,
    uploaded_by=uploaded_by,
    fraud_score="pending",
    is_valid=True,
    is_revoked=False
)

    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert

def get_certificate_by_id(db: Session, certificate_id: str):
    return db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id
    ).first()

def get_all_certificates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Certificate).order_by(
        Certificate.created_at.desc()
    ).offset(skip).limit(limit).all()

def revoke_certificate(db: Session, certificate_id: str, reason: str):
    cert = get_certificate_by_id(db, certificate_id)
    if cert:
        cert.is_revoked = True
        cert.is_valid = False
        cert.revocation_reason = reason
        db.commit()
        db.refresh(cert)
    return cert