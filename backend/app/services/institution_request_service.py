from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.institution_request import InstitutionRequest, RequestStatus
from app.models.user import User, UserRole
from app.schemas.institution_request import InstitutionRequestCreate
from app.core.security import get_password_hash
from datetime import datetime
import secrets
import string

def create_request(db: Session, data: InstitutionRequestCreate) -> InstitutionRequest:
    """Save institution registration request"""
    req = InstitutionRequest(
        institution_name=data.institution_name,
        contact_name=data.contact_name,
        email=data.email,
        phone=data.phone,
        institution_type=data.institution_type,
        message=data.message,
        status=RequestStatus.pending
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

def get_all_requests(db: Session, status: str = None):
    """Get all institution requests, optionally filtered by status"""
    query = db.query(InstitutionRequest)
    if status:
        query = query.filter(InstitutionRequest.status == status)
    return query.order_by(InstitutionRequest.created_at.desc()).all()

def get_pending_count(db: Session) -> int:
    """Get count of pending requests"""
    return db.query(InstitutionRequest).filter(
        InstitutionRequest.status == RequestStatus.pending
    ).count()

def generate_temp_password() -> str:
    """Generate a secure temporary password"""
    chars = string.ascii_letters + string.digits + "!@#$"
    return ''.join(secrets.choice(chars) for _ in range(12))

def approve_request(db: Session, request_id: int) -> dict:
    """
    Approve institution request:
    1. Create user account
    2. Mark request as approved
    3. Return credentials
    """
    req = db.query(InstitutionRequest).filter(
        InstitutionRequest.id == request_id
    ).first()

    if not req:
        return {"success": False, "message": "Request not found"}

    if req.status != RequestStatus.pending:
        return {"success": False, "message": "Request already reviewed"}

    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        return {"success": False, "message": "Email already has an account"}

    # Generate temp password
    temp_password = generate_temp_password()

    # Create institution user account
    new_user = User(
        full_name=req.institution_name,
        email=req.email,
        hashed_password=get_password_hash(temp_password),
        role=UserRole.institution,
        is_active=True
    )
    db.add(new_user)

    # Update request status
    req.status = RequestStatus.approved
    req.reviewed_at = datetime.now()

    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Institution approved and account created",
        "user_id": new_user.id,
        "email": req.email,
        "temp_password": temp_password,
        "institution_name": req.institution_name
    }

def reject_request(db: Session, request_id: int, reason: str) -> dict:
    """Reject institution request"""
    req = db.query(InstitutionRequest).filter(
        InstitutionRequest.id == request_id
    ).first()

    if not req:
        return {"success": False, "message": "Request not found"}

    if req.status != RequestStatus.pending:
        return {"success": False, "message": "Request already reviewed"}

    req.status = RequestStatus.rejected
    req.rejection_reason = reason
    req.reviewed_at = datetime.now()

    db.commit()

    return {
        "success": True,
        "message": "Request rejected",
        "email": req.email
    }