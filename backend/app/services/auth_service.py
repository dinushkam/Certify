from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import (
    get_password_hash, verify_password,
    validate_password_strength
)

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(
    db: Session,
    user: UserCreate,
    must_change_password: bool = False
):
    hashed = get_password_hash(user.password)
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed,
        role=user.role,
        must_change_password=must_change_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None, "invalid_credentials"

    # Check if locked
    if user.locked_until and user.locked_until > datetime.now(user.locked_until.tzinfo):
        remaining = int((user.locked_until - datetime.now(user.locked_until.tzinfo)).total_seconds() / 60)
        return None, f"account_locked:{remaining}"

    if not verify_password(password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            from sqlalchemy import func
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        attempts_left = MAX_LOGIN_ATTEMPTS - (user.failed_login_attempts or 0)
        return None, f"invalid_password:{attempts_left}"

    # Reset on success
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()
    return user, "success"

def change_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str
) -> dict:
    if not verify_password(current_password, user.hashed_password):
        return {"success": False, "message": "Current password is incorrect"}

    strength = validate_password_strength(new_password)
    if not strength["valid"]:
        return {"success": False, "message": ". ".join(strength["errors"])}

    user.hashed_password = get_password_hash(new_password)
    user.must_change_password = False
    db.commit()
    return {"success": True, "message": "Password changed successfully"}

def create_password_reset_token(db: Session, email: str) -> dict:
    from app.core.security import generate_reset_token
    user = get_user_by_email(db, email)
    if not user:
        # Don't reveal if email exists
        return {"success": True, "message": "If this email exists, a reset link has been sent"}

    token = generate_reset_token()
    user.password_reset_token = token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # Send email
    try:
        from app.services.email_service import send_password_reset_email
        send_password_reset_email(
            to_email=email,
            full_name=user.full_name,
            token=token
        )
    except Exception as e:
        print(f"Password reset email failed: {e}")

    return {"success": True, "message": "Password reset link sent to your email"}

def reset_password_with_token(
    db: Session,
    token: str,
    new_password: str
) -> dict:
    from app.core.security import validate_password_strength
    user = db.query(User).filter(
        User.password_reset_token == token
    ).first()

    if not user:
        return {"success": False, "message": "Invalid or expired reset token"}

    if user.password_reset_expires < datetime.utcnow():
        return {"success": False, "message": "Reset token has expired. Please request a new one"}

    strength = validate_password_strength(new_password)
    if not strength["valid"]:
        return {"success": False, "message": ". ".join(strength["errors"])}

    user.hashed_password = get_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.must_change_password = False
    db.commit()

    return {"success": True, "message": "Password reset successfully. You can now log in"}

def save_refresh_token(db: Session, user: User, token: str):
    user.refresh_token = token
    db.commit()

def invalidate_refresh_token(db: Session, user: User):
    user.refresh_token = None
    db.commit()