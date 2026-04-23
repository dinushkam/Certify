from sqlalchemy.orm import Session
from app.models.notification import Notification
from typing import Optional

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "info",
    link: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def get_notifications(
    db: Session,
    user_id: int,
    unread_only: bool = False,
    limit: int = 20
) -> list:
    q = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(limit).all()

def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

def mark_as_read(db: Session, notification_id: int, user_id: int):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()

def mark_all_read(db: Session, user_id: int):
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

def delete_notification(db: Session, notification_id: int, user_id: int):
    db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).delete()
    db.commit()