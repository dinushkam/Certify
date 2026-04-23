from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.certificate import Certificate
from app.models.user import User
from datetime import datetime, timedelta
from typing import Optional

def get_dashboard_stats(
    db: Session,
    institution_filter: Optional[str] = None
) -> dict:

    def base_q():
        q = db.query(Certificate)
        if institution_filter:
           from sqlalchemy import or_
           q = q.filter(
                or_(
                     Certificate.institution_id == institution_filter["id"],
                     Certificate.institution_name == institution_filter["name"]
        )
    )
        return q

    total = base_q().count()
    valid = base_q().filter(
        Certificate.is_valid == True,
        Certificate.is_revoked == False
    ).count()
    revoked = base_q().filter(Certificate.is_revoked == True).count()
    on_blockchain = base_q().filter(
        Certificate.blockchain_tx != None
    ).count()
    with_ocr = base_q().filter(Certificate.ocr_text != None).count()

    fraud_certs = base_q().filter(
        Certificate.fraud_score != None,
        Certificate.fraud_score != 'pending'
    ).all()

    fraud_analyzed = len(fraud_certs)
    high_risk = 0
    for cert in fraud_certs:
        try:
            if float(cert.fraud_score) > 50:
                high_risk += 1
        except (ValueError, TypeError):
            pass

    return {
        "total_certificates": total,
        "valid_certificates": valid,
        "revoked_certificates": revoked,
        "on_blockchain": on_blockchain,
        "with_ocr": with_ocr,
        "fraud_analyzed": fraud_analyzed,
        "high_risk_count": high_risk,
        "validity_rate": round((valid / total * 100), 1) if total > 0 else 0,
        "blockchain_coverage": round((on_blockchain / total * 100), 1) if total > 0 else 0
    }

def get_monthly_trends(
    db: Session,
    institution_filter: Optional[str] = None
) -> list:
    trends = []
    now = datetime.now()

    for i in range(11, -1, -1):
        month_date = now - timedelta(days=i * 30)
        month_str = month_date.strftime("%Y-%m")
        month_label = month_date.strftime("%b %Y")

        try:
            issued_q = db.query(Certificate).filter(
                func.to_char(
                    Certificate.created_at, 'YYYY-MM'
                ) == month_str
            )
            if institution_filter:
                issued_q = issued_q.filter(
                    Certificate.institution_name == institution_filter
                )
            issued = issued_q.count()

            revoked_q = db.query(Certificate).filter(
                func.to_char(
                    Certificate.created_at, 'YYYY-MM'
                ) == month_str,
                Certificate.is_revoked == True
            )
            if institution_filter:
                revoked_q = revoked_q.filter(
                    Certificate.institution_name == institution_filter
                )
            revoked = revoked_q.count()

        except Exception:
            issued = 0
            revoked = 0

        trends.append({
            "month": month_label,
            "month_key": month_str,
            "issued": issued,
            "revoked": revoked
        })

    return trends

def get_institution_breakdown(
    db: Session,
    institution_filter: Optional[str] = None
) -> list:
    try:
        q = db.query(
            Certificate.institution_name,
            func.count(Certificate.id).label('count')
        )
        if institution_filter:
            q = q.filter(
                Certificate.institution_name == institution_filter
            )
        results = q.group_by(
            Certificate.institution_name
        ).order_by(
            func.count(Certificate.id).desc()
        ).limit(10).all()
        return [
            {"institution": r.institution_name, "count": r.count}
            for r in results
        ]
    except Exception:
        return []

def get_course_breakdown(
    db: Session,
    institution_filter: Optional[str] = None
) -> list:
    try:
        q = db.query(
            Certificate.course_name,
            func.count(Certificate.id).label('count')
        )
        if institution_filter:
            q = q.filter(
                Certificate.institution_name == institution_filter
            )
        results = q.group_by(
            Certificate.course_name
        ).order_by(
            func.count(Certificate.id).desc()
        ).limit(10).all()
        return [
            {"course": r.course_name, "count": r.count}
            for r in results
        ]
    except Exception:
        return []

def get_fraud_risk_distribution(
    db: Session,
    institution_filter: Optional[str] = None
) -> dict:
    try:
        q = db.query(Certificate).filter(
            Certificate.fraud_score != None,
            Certificate.fraud_score != 'pending'
        )
        if institution_filter:
            q = q.filter(
                Certificate.institution_name == institution_filter
            )
        low = medium = high = 0
        for cert in q.all():
            try:
                score = float(cert.fraud_score)
                if score < 30:
                    low += 1
                elif score < 70:
                    medium += 1
                else:
                    high += 1
            except (ValueError, TypeError):
                pass
        return {
            "low_risk": low,
            "medium_risk": medium,
            "high_risk": high,
            "total_analyzed": low + medium + high
        }
    except Exception:
        return {
            "low_risk": 0,
            "medium_risk": 0,
            "high_risk": 0,
            "total_analyzed": 0
        }

def get_recent_activity(
    db: Session,
    institution_filter: Optional[str] = None,
    limit: int = 10
) -> list:
    try:
        q = db.query(Certificate)
        if institution_filter:
            q = q.filter(
                Certificate.institution_id == institution_filter
            )
        recent = q.order_by(
            Certificate.created_at.desc()
        ).limit(limit).all()

        return [
            {
                "certificate_id": c.certificate_id,
                "holder_name": c.holder_name,
                "institution_name": c.institution_name,
                "course_name": c.course_name,
                "is_valid": c.is_valid,
                "is_revoked": c.is_revoked,
                "on_blockchain": c.blockchain_tx is not None,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in recent
        ]
    except Exception:
        return []
    
def get_institution_filter(current_user: User):
    if current_user.role == "institution":
        return current_user.id  # Return ID not name
    return None