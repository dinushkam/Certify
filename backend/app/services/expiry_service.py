from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.certificate import Certificate
from datetime import date, timedelta

def get_expiry_status(expiry_date_str: str) -> str:
    """Return expiry status for a certificate"""
    if not expiry_date_str:
        return "no_expiry"
    try:
        expiry = date.fromisoformat(expiry_date_str)
        today = date.today()
        if expiry < today:
            return "expired"
        elif expiry <= today + timedelta(days=30):
            return "expiring_soon"
        else:
            return "active"
    except Exception:
        return "unknown"

def get_expiring_soon(db: Session, days: int = 30) -> list:
    """Get certificates expiring within N days"""
    today = str(date.today())
    soon = str(date.today() + timedelta(days=days))
    return db.query(Certificate).filter(
        and_(
            Certificate.expiry_date != None,
            Certificate.expiry_date >= today,
            Certificate.expiry_date <= soon,
            Certificate.is_revoked == False
        )
    ).all()

def get_expired(db: Session) -> list:
    """Get all expired certificates"""
    today = str(date.today())
    return db.query(Certificate).filter(
        and_(
            Certificate.expiry_date != None,
            Certificate.expiry_date < today,
            Certificate.is_revoked == False
        )
    ).all()