from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import UserRole
from app.services.auth_service import get_user_by_email
from app.services.institution_request_service import (
    create_request, get_all_requests,
    get_pending_count, approve_request, reject_request
)
from app.schemas.institution_request import (
    InstitutionRequestCreate, InstitutionRequestResponse
)
from typing import List

router = APIRouter()

def get_admin_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Verify admin token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_email(db, payload.get("sub"))
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.post("/submit", response_model=InstitutionRequestResponse)
def submit_request(
    data: InstitutionRequestCreate,
    db: Session = Depends(get_db)
):
    """Public endpoint — submit institution registration request"""
    req = create_request(db, data)
    return req

@router.get("/all", response_model=List[InstitutionRequestResponse])
def get_requests(
    status: Optional[str] = None,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin only — get all institution requests"""
    return get_all_requests(db, status)

@router.get("/pending-count")
def pending_count(
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin only — get pending request count"""
    return {"count": get_pending_count(db)}

@router.post("/approve/{request_id}")
def approve(
    request_id: int,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin only — approve institution request and create account"""
    result = approve_request(db, request_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/reject/{request_id}")
def reject(
    request_id: int,
    reason: str,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin only — reject institution request"""
    result = reject_request(db, request_id, reason)  # ✅ Pass reason
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result