import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@certverify.lk")
FROM_NAME = os.getenv("FROM_NAME", "CertVerify Sri Lanka")

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send email using SMTP"""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email failed: {e}")
        return False

def send_institution_approved(
    to_email: str,
    institution_name: str,
    temp_password: str
):
    """Send approval email to institution"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0B1F3A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">CertVerify Sri Lanka</h1>
      </div>
      <div style="padding: 32px; background: #ffffff; border: 1px solid #eee;">
        <h2 style="color: #0B1F3A;">Institution Account Approved ✅</h2>
        <p>Dear <strong>{institution_name}</strong>,</p>
        <p>Your institution registration request has been approved.
           You can now log in and start issuing certificates.</p>
        <div style="background: #F5E9C8; border: 1px solid #C9A84C;
                    border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Login Email:</strong> {to_email}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong>
            <code style="background: #fff; padding: 2px 8px;
                         border-radius: 4px;">{temp_password}</code>
          </p>
        </div>
        <p style="color: #e74c3c;">
          ⚠️ Please change your password after first login.
        </p>
        <a href="http://localhost:5173/login"
           style="display: inline-block; background: #0B1F3A; color: white;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: bold;">Login to Dashboard</a>
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
        CertVerify Sri Lanka — Official Credential Verification
      </div>
    </div>
    """
    return send_email(to_email, "Your Institution Account Has Been Approved", html)

def send_institution_rejected(
    to_email: str,
    institution_name: str,
    reason: str
):
    """Send rejection email"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0B1F3A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">CertVerify Sri Lanka</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #8B1A1A;">Registration Request Update</h2>
        <p>Dear <strong>{institution_name}</strong>,</p>
        <p>Unfortunately your institution registration request could not be approved at this time.</p>
        <div style="background: #FCEAEA; border-left: 4px solid #8B1A1A;
                    padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <strong>Reason:</strong> {reason}
        </div>
        <p>If you believe this is an error, please contact us at
           <a href="mailto:admin@certverify.lk">admin@certverify.lk</a></p>
      </div>
    </div>
    """
    return send_email(
        to_email,
        "CertVerify — Institution Registration Update",
        html
    )

def send_certificate_issued(
    to_email: str,
    holder_name: str,
    institution_name: str,
    course_name: str,
    certificate_id: str,
    issue_date: str
):
    """Send certificate issuance notification"""
    verify_url = f"http://localhost:5173/verify/{certificate_id}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0B1F3A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0;">CertVerify Sri Lanka</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #0B1F3A;">Your Certificate Has Been Issued 🎓</h2>
        <p>Dear <strong>{holder_name}</strong>,</p>
        <p>Your certificate from <strong>{institution_name}</strong>
           has been issued and registered on the blockchain.</p>
        <div style="background: #F5E9C8; border: 1px solid #C9A84C;
                    border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Certificate:</strong> {course_name}</p>
          <p style="margin: 4px 0;"><strong>Institution:</strong> {institution_name}</p>
          <p style="margin: 4px 0;"><strong>Issued:</strong> {issue_date}</p>
          <p style="margin: 4px 0;"><strong>ID:</strong>
            <code>{certificate_id}</code></p>
        </div>
        <a href="{verify_url}"
           style="display: inline-block; background: #0B1F3A; color: white;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: bold;">View & Share Certificate</a>
        <p style="margin-top: 20px; color: #666; font-size: 13px;">
          Share this link with employers to verify your credential:<br/>
          <a href="{verify_url}" style="color: #0B1F3A;">{verify_url}</a>
        </p>
      </div>
    </div>
    """
    return send_email(
        to_email,
        f"Your Certificate Has Been Issued — {course_name}",
        html
    )

def send_certificate_expiry_reminder(
    to_email: str,
    holder_name: str,
    course_name: str,
    certificate_id: str,
    expiry_date: str,
    days_left: int
):
    """Send expiry reminder"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0B1F3A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0;">CertVerify Sri Lanka</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #7A5200;">Certificate Expiring Soon ⚠️</h2>
        <p>Dear <strong>{holder_name}</strong>,</p>
        <p>Your certificate <strong>{course_name}</strong> will expire
           in <strong>{days_left} days</strong> on {expiry_date}.</p>
        <p>Please contact your institution for renewal if required.</p>
        <div style="background: #FEF6E4; border: 1px solid #f0d080;
                    border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #7A5200;">
            Certificate ID: <code>{certificate_id}</code><br/>
            Expires: {expiry_date}
          </p>
        </div>
      </div>
    </div>
    """
    return send_email(
        to_email,
        f"⚠️ Your Certificate Expires in {days_left} Days",
        html
    )

def send_password_reset_email(
    to_email: str,
    full_name: str,
    token: str
):
    reset_url = f"http://localhost:5173/reset-password?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0B1F3A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">CertVerify Sri Lanka</h1>
      </div>
      <div style="padding: 32px; background: #ffffff; border: 1px solid #eee;">
        <h2 style="color: #0B1F3A;">Reset Your Password</h2>
        <p>Dear <strong>{full_name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{reset_url}"
             style="display: inline-block; background: #0B1F3A; color: white;
                    padding: 14px 28px; border-radius: 8px; text-decoration: none;
                    font-weight: bold; font-size: 15px;">
            Reset Password
          </a>
        </div>
        <div style="background: #FEF6E4; border: 1px solid #f0d080;
                    border-radius: 8px; padding: 14px; margin: 20px 0;">
          <p style="margin: 0; color: #7A5200; font-size: 13px;">
            ⚠️ This link expires in <strong>1 hour</strong>.
            If you didn't request this, please ignore this email.
          </p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Or copy this link: <br/>
          <a href="{reset_url}" style="color: #0B1F3A; word-break: break-all;">{reset_url}</a>
        </p>
      </div>
    </div>
    """
    return send_email(to_email, "Reset Your CertVerify Password", html)

def send_password_changed_notification(to_email: str, full_name: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0B1F3A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0;">CertVerify Sri Lanka</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1A6B3C;">Password Changed Successfully ✅</h2>
        <p>Dear <strong>{full_name}</strong>,</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact us immediately at
           <a href="mailto:admin@certverify.lk">admin@certverify.lk</a></p>
      </div>
    </div>
    """
    return send_email(to_email, "Your Password Has Been Changed", html)