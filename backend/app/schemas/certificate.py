from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CertificateCreate(BaseModel):
    holder_name: str
    holder_email: Optional[str] = None
    institution_name: str
    course_name: str
    issue_date: str
    expiry_date: Optional[str] = None

class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    holder_name: str
    holder_email: Optional[str] = None
    institution_name: str
    course_name: str
    issue_date: str
    expiry_date: Optional[str] = None
    ipfs_hash: Optional[str] = None
    blockchain_hash: Optional[str] = None
    blockchain_tx: Optional[str] = None
    fraud_score: Optional[str] = None
    is_valid: bool
    is_revoked: bool
    revocation_reason: Optional[str] = None
    qr_code_path: Optional[str] = None
    ocr_text: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CertificateVerify(BaseModel):
    certificate_id: str