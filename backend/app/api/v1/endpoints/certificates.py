from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_institution
from app.models.user import User
from app.schemas.certificate import CertificateResponse
from app.services.certificate_service import (
    create_certificate, get_certificate_by_id,
    get_all_certificates, revoke_certificate
)
from app.services.blockchain_service import blockchain_service

router = APIRouter()

@router.post("/upload", response_model=CertificateResponse)
async def upload_certificate(
    holder_name: str = Form(...),
    course_name: str = Form(...),
    issue_date: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    holder_email: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_institution)
):
    """
    Upload certificate — institution name always from token
    NO institution_name in form — comes from current_user.full_name
    """
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and PDF files are allowed"
        )

    cert = create_certificate(
        db=db,
        holder_name=holder_name,
        institution_name=current_user.full_name,
        course_name=course_name,
        issue_date=issue_date,
        expiry_date=expiry_date if expiry_date else None,
        file=file,
        uploaded_by=current_user.id,
        holder_email=holder_email if holder_email else None
    )

    # Mandatory blockchain
    blockchain_result = blockchain_service.store_certificate(
        certificate_id=cert.certificate_id,
        holder_name=cert.holder_name,
        institution_name=cert.institution_name,
        course_name=cert.course_name,
        issue_date=cert.issue_date
    )

    if blockchain_result["success"]:
        cert.blockchain_hash = blockchain_result["certificate_hash"]
        cert.blockchain_tx = blockchain_result["tx_hash"]
        db.commit()
        db.refresh(cert)

    # Send email to student
    if holder_email and holder_email.strip():
        try:
            from app.services.email_service import send_certificate_issued
            send_certificate_issued(
                to_email=holder_email.strip(),
                holder_name=holder_name,
                institution_name=current_user.full_name,
                course_name=course_name,
                certificate_id=cert.certificate_id,
                issue_date=issue_date
            )
        except Exception as e:
            print(f"Email send failed: {e}")

    return cert

@router.get("/verify/{certificate_id}", response_model=CertificateResponse)
def verify_certificate(
    certificate_id: str,
    db: Session = Depends(get_db)
    # ✅ Public endpoint — no auth needed for verification
):
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    return cert

@router.get("/verify-full/{certificate_id}")
def verify_certificate_full(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """
    Full verification — checks DB + Blockchain + Fraud Score
    Returns complete verification result
    """
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    # ✅ MANDATORY BLOCKCHAIN CHECK
    blockchain_result = blockchain_service.verify_on_chain(certificate_id)

    # Determine overall validity
    db_valid = cert.is_valid and not cert.is_revoked
    chain_valid = blockchain_result.get("is_valid", False)

    # If on blockchain, cross-check hash
    hash_match = True
    if blockchain_result.get("certificate_hash") and cert.blockchain_hash:
        hash_match = blockchain_result["certificate_hash"] == cert.blockchain_hash

    overall_valid = db_valid and chain_valid and hash_match

    # Fraud score interpretation
    fraud_score = cert.fraud_score
    fraud_risk = "unknown"
    if fraud_score and fraud_score != "pending":
        try:
            score = float(fraud_score)
            if score < 30:
                fraud_risk = "low"
            elif score < 70:
                fraud_risk = "medium"
            else:
                fraud_risk = "high"
        except ValueError:
            pass

    return {
        "certificate": {
            "id": cert.id,
            "certificate_id": cert.certificate_id,
            "holder_name": cert.holder_name,
            "institution_name": cert.institution_name,
            "course_name": cert.course_name,
            "issue_date": cert.issue_date,
            "expiry_date": cert.expiry_date,
            "is_valid": cert.is_valid,
            "is_revoked": cert.is_revoked,
            "revocation_reason": cert.revocation_reason,
            "fraud_score": cert.fraud_score,
            "fraud_risk": fraud_risk,
            "blockchain_tx": cert.blockchain_tx,
            "blockchain_hash": cert.blockchain_hash,
            "qr_code_path": cert.qr_code_path,
            "created_at": cert.created_at.isoformat() if cert.created_at else None,
        },
        "blockchain": {
            "connected": blockchain_service.is_connected(),
            "on_chain": blockchain_result.get("success", False),
            "is_valid": chain_valid,
            "hash_match": hash_match,
            "certificate_hash": blockchain_result.get("certificate_hash"),
            "issued_by": blockchain_result.get("issued_by"),
            "timestamp": blockchain_result.get("timestamp"),
            "message": blockchain_result.get("message")
        },
        "verification": {
            "overall_valid": overall_valid,
            "db_check": db_valid,
            "blockchain_check": chain_valid,
            "hash_integrity": hash_match,
            "fraud_risk": fraud_risk,
            "verified_at": __import__('datetime').datetime.now().isoformat()
        }
    }
@router.get("/all", response_model=List[CertificateResponse])
def get_certificates(
    skip: int = 0,
    limit: int = 100,
    institution: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "employer":
        raise HTTPException(
            status_code=403,
            detail="Employers cannot access certificate lists"
        )

    from app.models.certificate import Certificate
    from sqlalchemy import or_
    q = db.query(Certificate)

    # ✅ Institution sees ONLY their own certificates
    # Filter by institution_id OR institution_name (fallback for old records)
    if current_user.role == "institution":
        q = q.filter(
            or_(
                Certificate.institution_id == current_user.id,
                Certificate.institution_name == current_user.full_name
            )
        )

    # Admin filters
    if current_user.role == "admin":
        if institution:
            q = q.filter(
                Certificate.institution_name.ilike(f"%{institution}%")
            )
        if status == "valid":
            q = q.filter(
                Certificate.is_valid == True,
                Certificate.is_revoked == False
            )
        elif status == "revoked":
            q = q.filter(Certificate.is_revoked == True)
        elif status == "expired":
            from datetime import date
            today = str(date.today())
            q = q.filter(
                Certificate.expiry_date != None,
                Certificate.expiry_date < today
            )

    return q.order_by(
        Certificate.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.post("/revoke/{certificate_id}")
def revoke(
    certificate_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke certificate — admin or institution only"""
    if current_user.role not in ["admin", "institution"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and institutions can revoke certificates"
        )

    cert = revoke_certificate(db, certificate_id, reason)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    # Also revoke on blockchain
    blockchain_service.revoke_on_chain(certificate_id, reason)

    return {
        "message": "Certificate revoked successfully",
        "certificate_id": certificate_id
    }

@router.get("/qr/{certificate_id}")
def get_qr_code(certificate_id: str, db: Session = Depends(get_db)):
    """Public — get QR code image"""
    cert = get_certificate_by_id(db, certificate_id)
    if not cert or not cert.qr_code_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR code not found"
        )
    return FileResponse(cert.qr_code_path, media_type="image/png")

@router.post("/verify-by-ocr")
async def verify_by_ocr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Verify certificate by uploading the certificate image
    OCR extracts the certificate ID then verifies
    """
    import shutil, uuid, os
    from app.services.ocr_service import process_certificate_file

    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and PDF files are allowed"
        )

    # Save temp file
    temp_path = f"uploads/temp_verify_{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
    os.makedirs("uploads", exist_ok=True)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Run OCR
        ocr_result = process_certificate_file(temp_path)

        if not ocr_result["success"]:
            return {
                "found": False,
                "ocr_success": False,
                "message": "Could not extract text from image",
                "ocr_error": ocr_result.get("error")
            }

        extracted_text = ocr_result.get("full_text", "")

        # Try to find CERT-XXXX pattern in extracted text
        import re
        cert_pattern = re.findall(r'CERT-[A-F0-9]{12}', extracted_text.upper())

        if not cert_pattern:
            return {
                "found": False,
                "ocr_success": True,
                "ocr_text": extracted_text[:500],
                "message": "No certificate ID found in image. Please enter ID manually.",
                "extracted_fields": ocr_result.get("extracted_fields", {})
            }

        # Try each found ID
        for cert_id in cert_pattern:
            cert = get_certificate_by_id(db, cert_id)
            if cert:
                # Full verification
                blockchain_result = blockchain_service.verify_on_chain(cert_id)
                db_valid = cert.is_valid and not cert.is_revoked
                chain_valid = blockchain_result.get("is_valid", False)
                overall_valid = db_valid and chain_valid

                return {
                    "found": True,
                    "ocr_success": True,
                    "certificate_id_found": cert_id,
                    "ocr_text": extracted_text[:500],
                    "certificate": {
                        "certificate_id": cert.certificate_id,
                        "holder_name": cert.holder_name,
                        "institution_name": cert.institution_name,
                        "course_name": cert.course_name,
                        "issue_date": cert.issue_date,
                        "is_valid": cert.is_valid,
                        "is_revoked": cert.is_revoked,
                        "fraud_score": cert.fraud_score,
                        "blockchain_tx": cert.blockchain_tx,
                    },
                    "blockchain": blockchain_result,
                    "verification": {
                        "overall_valid": overall_valid,
                        "db_check": db_valid,
                        "blockchain_check": chain_valid,
                    }
                }

        return {
            "found": False,
            "ocr_success": True,
            "ocr_text": extracted_text[:500],
            "ids_found": cert_pattern,
            "message": f"Found ID {cert_pattern[0]} in image but not in database"
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/retry-blockchain/{certificate_id}")
def retry_blockchain(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retry blockchain storage for a failed certificate"""
    if current_user.role not in ["admin", "institution"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    if cert.blockchain_tx:
        return {"message": "Already on blockchain", "tx": cert.blockchain_tx}

    result = blockchain_service.store_certificate(
        certificate_id=cert.certificate_id,
        holder_name=cert.holder_name,
        institution_name=cert.institution_name,
        course_name=cert.course_name,
        issue_date=cert.issue_date
    )

    if result["success"]:
        cert.blockchain_hash = result["certificate_hash"]
        cert.blockchain_tx = result["tx_hash"]
        db.commit()

    return result

@router.post("/retry-ocr/{certificate_id}")
def retry_ocr(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retry OCR for a certificate"""
    import os
    from app.services.ocr_service import process_certificate_file

    if current_user.role not in ["admin", "institution"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    cert = get_certificate_by_id(db, certificate_id)
    if not cert or not cert.file_path:
        raise HTTPException(status_code=404, detail="Certificate or file not found")

    if not os.path.exists(cert.file_path):
        raise HTTPException(status_code=404, detail="Certificate file missing from storage")

    result = process_certificate_file(cert.file_path)
    if result["success"]:
        cert.ocr_text = result["full_text"]
        db.commit()

    return {"certificate_id": certificate_id, "ocr_result": result}

@router.post("/bulk-upload")
async def bulk_upload(
    course_name: str = Form(...),
    issue_date: str = Form(...),
    csv_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_institution)
):
    """
    Bulk upload from CSV
    CSV: holder_name, email(optional), expiry_date(optional)
    Institution name always from JWT token
    """
    import csv, io
    from app.services.qr_service import generate_qr_code
    from app.services.certificate_service import generate_certificate_id
    from app.models.certificate import Certificate
    from app.services.email_service import send_certificate_issued

    institution_name = current_user.full_name  # ✅ Always from token

    content = await csv_file.read()
    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    results = []
    success_count = 0
    failed_count = 0
    emails_sent = 0

    for row in reader:
        try:
            holder_name = (
                row.get("holder_name") or
                row.get("name") or
                row.get("Name") or ""
            ).strip()

            if not holder_name:
                continue

            holder_email = (
                row.get("email") or
                row.get("Email") or ""
            ).strip() or None

            expiry_date = (
                row.get("expiry_date") or
                row.get("expiry") or ""
            ).strip() or None

            cert_id = generate_certificate_id()
            qr_path = generate_qr_code(cert_id)

            db_cert = Certificate(
                certificate_id=cert_id,
                holder_name=holder_name,
                holder_email=holder_email,
                institution_name=institution_name,
                course_name=course_name,
                issue_date=issue_date,
                expiry_date=expiry_date,
                qr_code_path=qr_path,
                uploaded_by=current_user.id,
                fraud_score="pending",
                is_valid=True,
                is_revoked=False
            )
            db.add(db_cert)
            db.commit()
            db.refresh(db_cert)

            # Blockchain
            try:
                bc_result = blockchain_service.store_certificate(
                    certificate_id=cert_id,
                    holder_name=holder_name,
                    institution_name=institution_name,
                    course_name=course_name,
                    issue_date=issue_date
                )
                if bc_result["success"]:
                    db_cert.blockchain_hash = bc_result["certificate_hash"]
                    db_cert.blockchain_tx = bc_result["tx_hash"]
                    db.commit()
            except Exception as e:
                print(f"Blockchain failed: {e}")

            # Email
            email_sent = False
            if holder_email:
                try:
                    send_certificate_issued(
                        to_email=holder_email,
                        holder_name=holder_name,
                        institution_name=institution_name,
                        course_name=course_name,
                        certificate_id=cert_id,
                        issue_date=issue_date
                    )
                    email_sent = True
                    emails_sent += 1
                except Exception as e:
                    print(f"Email failed for {holder_email}: {e}")

            success_count += 1
            results.append({
                "holder_name": holder_name,
                "holder_email": holder_email,
                "certificate_id": cert_id,
                "email_sent": email_sent,
                "status": "success"
            })

        except Exception as e:
            failed_count += 1
            results.append({
                "holder_name": row.get("holder_name", "unknown"),
                "status": "failed",
                "error": str(e)
            })

    return {
        "total": success_count + failed_count,
        "success": success_count,
        "failed": failed_count,
        "emails_sent": emails_sent,
        "results": results
    }

@router.get("/search")
def search_certificates(
    holder_name: Optional[str] = None,
    institution_name: Optional[str] = None,
    course_name: Optional[str] = None,
    issue_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Public search — limited to 10 results, only valid certs"""
    if not any([holder_name, institution_name, course_name]):
        raise HTTPException(
            status_code=400,
            detail="At least one search field required"
        )

    from app.models.certificate import Certificate
    q = db.query(Certificate).filter(
        Certificate.is_valid == True,
        Certificate.is_revoked == False
    )

    if holder_name:
        q = q.filter(Certificate.holder_name.ilike(f"%{holder_name}%"))
    if institution_name:
        q = q.filter(Certificate.institution_name.ilike(f"%{institution_name}%"))
    if course_name:
        q = q.filter(Certificate.course_name.ilike(f"%{course_name}%"))
    if current_user and current_user.role == "institution":
        q = q.filter(Certificate.institution_id == current_user.id)
    if issue_date:
        q = q.filter(Certificate.issue_date == issue_date)

    results = q.limit(10).all()  # ✅ Max 10 results

    # ✅ Return limited info only
    return [
        {
            "certificate_id": c.certificate_id,
            "holder_name": c.holder_name,
            "institution_name": c.institution_name,
            "course_name": c.course_name,
            "issue_date": c.issue_date,
            "is_valid": c.is_valid,
            "is_revoked": c.is_revoked
        }
        for c in results
    ]