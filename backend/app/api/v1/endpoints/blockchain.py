from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.blockchain_service import blockchain_service
from app.services.certificate_service import get_certificate_by_id

router = APIRouter()

@router.post("/store/{certificate_id}")
def store_on_blockchain(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Store certificate hash on blockchain"""
    
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    result = blockchain_service.store_certificate(
        certificate_id=cert.certificate_id,
        holder_name=cert.holder_name,
        institution_name=cert.institution_name,
        course_name=cert.course_name,
        issue_date=cert.issue_date
    )
    
    # Update database with blockchain info
    if result["success"]:
        cert.blockchain_hash = result["certificate_hash"]
        cert.blockchain_tx = result["tx_hash"]
        db.commit()
    
    return {
        "certificate_id": certificate_id,
        "blockchain_result": result
    }

@router.get("/verify/{certificate_id}")
def verify_on_blockchain(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Verify certificate on blockchain"""
    
    result = blockchain_service.verify_on_chain(certificate_id)
    
    return {
        "certificate_id": certificate_id,
        "blockchain_verification": result
    }

@router.get("/status")
def blockchain_status():
    """Check blockchain connection status"""
    return {
        "connected": blockchain_service.is_connected(),
        "account": blockchain_service.account
    }