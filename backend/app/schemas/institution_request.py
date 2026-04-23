from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.institution_request import RequestStatus

class InstitutionRequestCreate(BaseModel):
    institution_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    institution_type: str
    message: Optional[str] = None

class InstitutionRequestResponse(BaseModel):
    id: int
    institution_name: str
    contact_name: str
    email: str
    phone: Optional[str]
    institution_type: str
    message: Optional[str]
    status: RequestStatus
    rejection_reason: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True