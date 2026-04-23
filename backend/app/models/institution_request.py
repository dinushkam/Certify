from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class InstitutionRequest(Base):
    __tablename__ = "institution_requests"

    id = Column(Integer, primary_key=True, index=True)
    institution_name = Column(String, nullable=False)
    contact_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    institution_type = Column(String, nullable=False)
    message = Column(String, nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.pending)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)