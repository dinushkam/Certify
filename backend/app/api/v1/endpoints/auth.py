from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import (
    decode_refresh_token, create_access_token,
    create_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES,
    validate_password_strength
)
from app.core.deps import get_current_user
from app.schemas.user import (
    UserCreate, UserLogin, Token, TokenRefresh,
    ChangePasswordRequest, ForgotPasswordRequest,
    ResetPasswordRequest, UpdateProfileRequest
)
from app.services.auth_service import (
    get_user_by_email, create_user, authenticate_user,
    change_password, create_password_reset_token,
    reset_password_with_token, save_refresh_token,
    invalidate_refresh_token
)
from app.models.user import User, UserRole
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.role == UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created via registration"
        )
    if user.role == UserRole.institution:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Institution accounts require admin approval. Please contact admin@certverify.lk"
        )

    # Validate password strength
    strength = validate_password_strength(user.password)
    if not strength["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=". ".join(strength["errors"])
        )

    existing = get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = create_user(db, user)
    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})
    save_refresh_token(db, new_user, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    user, result = authenticate_user(db, user_data.email, user_data.password)

    if result.startswith("account_locked"):
        minutes = result.split(":")[1]
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to too many failed attempts. Try again in {minutes} minutes."
        )

    if result.startswith("invalid_password"):
        attempts_left = result.split(":")[1]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect password. {attempts_left} attempts remaining before lockout."
        )

    if result == "invalid_credentials":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact admin."
        )

    expire_delta = timedelta(days=7) if user_data.remember_me else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=expire_delta
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    save_refresh_token(db, user, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh")
def refresh_token(data: TokenRefresh, db: Session = Depends(get_db)):
    payload = decode_refresh_token(data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    email = payload.get("sub")
    user = get_user_by_email(db, email)

    if not user or user.refresh_token != data.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token mismatch. Please log in again."
        )

    new_access_token = create_access_token(data={"sub": user.email})
    new_refresh_token = create_refresh_token(data={"sub": user.email})
    save_refresh_token(db, user, new_refresh_token)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invalidate_refresh_token(db, current_user)
    return {"message": "Logged out successfully"}

@router.post("/change-password")
def change_pwd(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = change_password(
        db, current_user,
        data.current_password,
        data.new_password
    )
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    return result

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    result = create_password_reset_token(db, data.email)
    return result

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    result = reset_password_with_token(db, data.token, data.new_password)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    return result

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.full_name:
        current_user.full_name = data.full_name
        db.commit()
        db.refresh(current_user)
    return current_user

@router.post("/validate-password")
def validate_password(password: str):
    return validate_password_strength(password)

@router.post("/admin/create-user", response_model=Token)
def admin_create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    existing = get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = create_user(db, user, must_change_password=True)
    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})
    save_refresh_token(db, new_user, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user
    }