from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, unique=True, index=True, nullable=False)
    holder_name = Column(String, nullable=False)
    holder_email = Column(String, nullable=True)
    institution_name = Column(String, nullable=False)
    course_name = Column(String, nullable=False)
    issue_date = Column(String, nullable=False)
    expiry_date = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    ipfs_hash = Column(String, nullable=True)
    blockchain_hash = Column(String, nullable=True)
    blockchain_tx = Column(String, nullable=True)
    fraud_score = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)
    is_valid = Column(Boolean, default=True)
    is_revoked = Column(Boolean, default=False)
    revocation_reason = Column(String, nullable=True)
    qr_code_path = Column(String, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    institution_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # updated_at removed — not in DB