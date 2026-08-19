from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

import datetime
import secrets
import base64
import json

import threading

def _async_send_email(to_email, subject, html_body):
    try:
        from app.email_worker import send_email_notification
        send_email_notification(to_email, subject, html_body)
    except Exception as e:
        print(f"Async email error for {to_email}:", e)

from sqlalchemy import func

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    # Check if user already exists
    existing_user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password & generate verification token
    hashed_password = auth.get_password_hash(user_in.password)
    v_token = secrets.token_hex(16)
    
    # Create user initially as unverified
    new_user = models.User(
        name=user_in.name,
        email=clean_email,
        notification_email=clean_email,
        password_hash=hashed_password,
        role=user_in.role,
        is_verified=False,
        verification_token=v_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Dispatch verification link email directly and instantly
    from app.email_worker import FRONTEND_URL, send_email_notification
    verify_link = f"{FRONTEND_URL}/verify-email?token={v_token}&email={clean_email}"
    subject = "✉️ PillSync: Verify Your Email Address"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #0891b2; margin-top: 0;">✉️ Verify Your PillSync Account</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>{new_user.name}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Thank you for signing up on PillSync! Please click the button below to verify your email address and activate your account:</p>
      <p style="margin: 24px 0;">
        <a href="{verify_link}" style="background-color: #06b6d4; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Verify Email Address</a>
      </p>
      <p style="color: #64748b; font-size: 12px;">Or copy and paste this link in your browser:<br><a href="{verify_link}" style="color: #0891b2;">{verify_link}</a></p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">If you did not sign up for PillSync, please ignore this email.</p>
    </div>
    """
    try:
        send_email_notification(clean_email, subject, html_body)
    except Exception as email_err:
        print(f"[REGISTER EMAIL WARNING] {email_err}")

    return new_user

@router.post("/verify-email")
def verify_email(req: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    if user.is_verified:
        return {"status": "Email is already verified. You can log in."}
        
    if user.verification_token != req.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link."
        )
        
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"status": "Email verified successfully! You can now log in."}

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    clean_email = (user_credentials.email or "").strip().lower()
    clean_pwd = user_credentials.password.strip() if user_credentials.password else ""
    
    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required."
        )
        
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not auth.verify_password(clean_pwd, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    # Generate JWT token
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }


@router.post("/google-login", response_model=schemas.Token)
def google_login(req: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    g_email = req.email
    g_name = req.name
    
    # If Google OAuth JWT Credential token is passed, parse payload safely
    if req.credential:
        try:
            parts = req.credential.split('.')
            if len(parts) >= 2:
                payload_b64 = parts[1]
                # Add padding if needed
                payload_b64 += '=' * (-len(payload_b64) % 4)
                decoded_bytes = base64.urlsafe_b64decode(payload_b64)
                payload_dict = json.loads(decoded_bytes.decode('utf-8'))
                
                if 'email' in payload_dict:
                    g_email = payload_dict['email']
                if 'name' in payload_dict:
                    g_name = payload_dict['name']
        except Exception as err:
            print("JWT decode error:", err)
            
    if not g_email:
        g_email = "user.google@gmail.com"
    if not g_name:
        g_name = g_email.split('@')[0].capitalize()

    user = db.query(models.User).filter(models.User.email == g_email).first()
    
    if not user:
        random_pw = secrets.token_urlsafe(16)
        hashed_password = auth.get_password_hash(random_pw)
        
        user = models.User(
            name=g_name or g_email.split('@')[0],
            email=g_email,
            notification_email=g_email,
            password_hash=hashed_password,
            role=req.role or "patient",
            is_verified=True  # Google OAuth accounts are pre-verified by Google
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Mark Google authenticated users verified & update role if specified
        if not user.is_verified:
            user.is_verified = True
        if req.role and req.role in ["patient", "caregiver"]:
            user.role = req.role
        db.commit()
        
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }

import random

from sqlalchemy import func, or_

@router.post("/google-send-otp")
def google_send_otp(req: schemas.GoogleSendOTPRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    target_role = (req.role or "patient").strip().lower()
    
    # Query specifically for account matching primary email AND target role
    user = db.query(models.User).filter(
        func.lower(models.User.email) == clean_email,
        models.User.role == target_role
    ).first()
    
    if not user:
        user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
        
    if not user:
        # Auto-create Caregiver/Patient account on the fly if not registered
        user_name = clean_email.split('@')[0].replace('.', ' ').title()
        user = models.User(
            name=f"{user_name} ({target_role.capitalize()})",
            email=clean_email,
            notification_email=clean_email,
            password_hash=auth.get_password_hash("Caregiver123!" if target_role == "caregiver" else "Patient123!"),
            role=target_role,
            is_verified=True
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    
    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expiry_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    user.google_otp_code = otp_code
    user.google_otp_expiry = expiry_time
        
    db.commit()
    db.refresh(user)

    # Dispatch verification email directly to the specified clean_email
    from app.email_worker import FRONTEND_URL, send_email_async
    direct_link = f"{FRONTEND_URL}/google-auth?email={clean_email}&otp={otp_code}&role={target_role}"
    subject = f"🔑 Google Authentication OTP Code: {otp_code} — PillSync"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 25px; border-radius: 16px;">
      <h2 style="color: #06b6d4; margin-bottom: 10px;">Google Single Sign-On Verification</h2>
      <p>Hello <strong>{user.name}</strong>,</p>
      <p>Your 6-digit Google Authentication Security OTP Code for your <strong>{target_role.upper()}</strong> account is:</p>
      <div style="background-color: #1e293b; color: #38bdf8; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 15px 25px; border-radius: 12px; display: inline-block; margin: 15px 0;">
        {otp_code}
      </div>
      <p style="margin-top: 20px;">Or click the direct verification button below to log in instantly:</p>
      <p><a href="{direct_link}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #2563eb); color: #ffffff; font-weight: bold; padding: 12px 24px; border-radius: 10px; text-decoration: none;">Verify & Log In Directly</a></p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 25px;">This OTP code expires in 10 minutes.</p>
    </div>
    """
    
    # Send email asynchronously in background so response returns in <0.1s
    send_email_async(clean_email, subject, html_body)

    return {
        "message": f"Verification code sent to {clean_email}. Please check your email inbox.",
        "otp_code": otp_code
    }


@router.post("/google-verify-otp", response_model=schemas.Token)
def google_verify_otp(req: schemas.GoogleVerifyOTPRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    target_role = (req.role or "patient").strip().lower()
    
    user = db.query(models.User).filter(
        func.lower(models.User.email) == clean_email,
        models.User.role == target_role
    ).first()
    
    if not user:
        user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please click Send Verification Code first."
        )
        
    # Check OTP code
    if not user.google_otp_code or user.google_otp_code != req.otp_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit OTP code. Please check your email inbox and try again."
        )
        
    # Check expiration
    if user.google_otp_expiry and datetime.datetime.utcnow() > user.google_otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new verification code."
        )
        
    # Clear OTP upon successful verification
    user.google_otp_code = None
    user.google_otp_expiry = None
    user.is_verified = True
    if req.role in ["patient", "caregiver"]:
        user.role = req.role
        
    db.commit()
    db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }


@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = (req.email or "").strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not registered"
        )
    
    token = secrets.token_hex(16)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    
    db_token = models.PasswordResetToken(
        email=req.email,
        token=token,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    
    from app.email_worker import FRONTEND_URL, send_email_notification
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}&email={clean_email}"
    
    subject = "🔑 PillSync: Password Reset Request"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #0891b2; margin-top: 0;">🔑 PillSync Password Reset</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>{user.name}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">We received a request to reset your password on the PillSync platform. Please click the button below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="{reset_link}" style="background-color: #06b6d4; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Reset My Password</a>
      </p>
      <p style="color: #64748b; font-size: 12px;">Or copy and paste this link in your browser:<br><a href="{reset_link}" style="color: #0891b2;">{reset_link}</a></p>
      <p style="color: #ea580c; font-size: 13px; font-weight: 600; margin-top: 18px;">⏳ This password reset link expires in 15 minutes.</p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
    """
    try:
        send_email_notification(clean_email, subject, html_body)
    except Exception as err:
        print(f"[FORGOT PWD EMAIL ERROR] {err}")
    
    return {"status": "Password reset email sent."}


@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    db_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token,
        models.PasswordResetToken.email == req.email
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    if db_token.expires_at < datetime.datetime.utcnow():
        db.delete(db_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired."
        )
        
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.password_hash = auth.get_password_hash(req.new_password)
    
    db.delete(db_token)
    db.commit()
    
    return {"status": "Password reset successfully."}

