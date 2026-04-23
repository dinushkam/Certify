from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.analytics_service import (
    get_dashboard_stats,
    get_monthly_trends,
    get_institution_breakdown,
    get_course_breakdown,
    get_fraud_risk_distribution,
    get_recent_activity
)

router = APIRouter()

def get_institution_filter(current_user: User):
    if current_user.role == "institution":
        return {"id": current_user.id, "name": current_user.full_name}
    return None

@router.get("/dashboard")
def dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    institution_filter = get_institution_filter(current_user)
    return {
        "stats": get_dashboard_stats(db, institution_filter),
        "monthly_trends": get_monthly_trends(db, institution_filter),
        "institution_breakdown": get_institution_breakdown(db, institution_filter),
        "course_breakdown": get_course_breakdown(db, institution_filter),
        "fraud_distribution": get_fraud_risk_distribution(db, institution_filter),
        "recent_activity": get_recent_activity(db, institution_filter)
    }

@router.get("/stats")
def quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    institution_filter = get_institution_filter(current_user)
    return get_dashboard_stats(db, institution_filter)

@router.get("/trends")
def trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    institution_filter = get_institution_filter(current_user)
    return get_monthly_trends(db, institution_filter)

@router.get("/institutions")
def institutions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    institution_filter = get_institution_filter(current_user)
    return get_institution_breakdown(db, institution_filter)

@router.get("/fraud-distribution")
def fraud_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    institution_filter = get_institution_filter(current_user)
    return get_fraud_risk_distribution(db, institution_filter)

@router.get("/recent")
def recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    institution_filter = get_institution_filter(current_user)
    return get_recent_activity(db, institution_filter)