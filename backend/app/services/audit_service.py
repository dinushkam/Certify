from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
import json

def log_action(
    db: Session,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    user_id: int = None,
    user_email: str = None,
    user_role: str = None,
    details: dict = None,
    ip_address: str = None,
    status: str = "success"
):
    """Log any action in the system"""
    log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
        status=status
    )
    db.add(log)
    db.commit()
    return log

def get_audit_logs(
    db: Session,
    entity_id: str = None,
    action: str = None,
    user_email: str = None,
    limit: int = 100
):
    query = db.query(AuditLog)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_email:
        query = query.filter(AuditLog.user_email == user_email)
    return query.order_by(
        AuditLog.created_at.desc()
    ).limit(limit).all()