from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.certificate import Certificate
from app.services.audit_service import log_action
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def run_ocr_task(self, certificate_id: str, file_path: str):
    """Background OCR processing"""
    db = SessionLocal()
    try:
        from app.services.ocr_service import process_certificate_file
        result = process_certificate_file(file_path)

        cert = db.query(Certificate).filter(
            Certificate.certificate_id == certificate_id
        ).first()

        if cert and result["success"]:
            cert.ocr_text = result["full_text"]
            db.commit()
            log_action(
                db, "ocr_complete",
                entity_type="certificate",
                entity_id=certificate_id,
                details={"confidence": result.get("confidence")},
                status="success"
            )
        return {"success": True, "certificate_id": certificate_id}
    except Exception as exc:
        logger.error(f"OCR failed for {certificate_id}: {exc}")
        log_action(
            db, "ocr_failed",
            entity_type="certificate",
            entity_id=certificate_id,
            details={"error": str(exc)},
            status="failed"
        )
        raise self.retry(exc=exc)
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def run_blockchain_task(self, certificate_id: str):
    """Background blockchain storage with retry"""
    db = SessionLocal()
    try:
        from app.services.blockchain_service import blockchain_service
        from app.services.certificate_service import get_certificate_by_id

        cert = get_certificate_by_id(db, certificate_id)
        if not cert:
            return {"success": False, "message": "Certificate not found"}

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
            log_action(
                db, "blockchain_stored",
                entity_type="certificate",
                entity_id=certificate_id,
                details={"tx_hash": result["tx_hash"]},
                status="success"
            )
            return {"success": True, "tx_hash": result["tx_hash"]}
        else:
            raise Exception(result["message"])

    except Exception as exc:
        logger.error(f"Blockchain failed for {certificate_id}: {exc}")
        log_action(
            db, "blockchain_failed",
            entity_type="certificate",
            entity_id=certificate_id,
            details={"error": str(exc)},
            status="failed"
        )
        raise self.retry(exc=exc)
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=2)
def run_fraud_task(self, certificate_id: str, file_path: str):
    """Background fraud analysis"""
    db = SessionLocal()
    try:
        from app.services.fraud_service import analyze_certificate, auto_flag_if_risky
        result = analyze_certificate(file_path)

        cert = db.query(Certificate).filter(
            Certificate.certificate_id == certificate_id
        ).first()

        if cert:
            cert.fraud_score = str(result["fraud_score"])
            db.commit()

            if result["fraud_score"] > 0:
                auto_flag_if_risky(db, certificate_id, result["fraud_score"])

            log_action(
                db, "fraud_analyzed",
                entity_type="certificate",
                entity_id=certificate_id,
                details={
                    "score": result["fraud_score"],
                    "prediction": result["prediction"]
                },
                status="success"
            )

        return {"success": True, "result": result}
    except Exception as exc:
        raise self.retry(exc=exc)
    finally:
        db.close()