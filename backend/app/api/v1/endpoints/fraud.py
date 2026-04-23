from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.fraud_service import analyze_certificate
from app.services.certificate_service import get_certificate_by_id
import os

router = APIRouter()

@router.post("/analyze/{certificate_id}")
def analyze_fraud(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Analyze a certificate for fraud using CNN model"""
    
    # Get certificate
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
    
    # Run fraud analysis
    result = analyze_certificate(cert.file_path)
    
    # Update fraud score in database
    cert.fraud_score = str(result["fraud_score"])
    db.commit()
    
    return {
        "certificate_id": certificate_id,
        "fraud_analysis": result
    }

@router.get("/status/{certificate_id}")
def get_fraud_status(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Get fraud analysis status for a certificate"""
    
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    return {
        "certificate_id": certificate_id,
        "fraud_score": cert.fraud_score,
        "is_valid": cert.is_valid,
        "is_revoked": cert.is_revoked
    }