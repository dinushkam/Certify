from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.notification_service import (
    get_notifications, get_unread_count,
    mark_as_read, mark_all_read, delete_notification
)

router = APIRouter()

@router.get("/")
def list_notifications(
    unread_only: bool = False,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = get_notifications(db, current_user.id, unread_only, limit)
    unread = get_unread_count(db, current_user.id)
    return {
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "link": n.link,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifications
        ],
        "unread_count": unread
    }

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mark_as_read(db, notification_id, current_user.id)
    return {"message": "Marked as read"}

@router.put("/mark-all-read")
def mark_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mark_all_read(db, current_user.id)
    return {"message": "All marked as read"}

@router.delete("/{notification_id}")
def delete(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delete_notification(db, notification_id, current_user.id)
    return {"message": "Deleted"}