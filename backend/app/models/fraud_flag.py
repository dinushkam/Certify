from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.core.database import Base

class FraudFlag(Base):
    __tablename__ = "fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, nullable=False, index=True)
    fraud_score = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)  # low/medium/high
    auto_flagged = Column(Boolean, default=True)
    reviewed = Column(Boolean, default=False)
    reviewed_by = Column(String, nullable=True)
    admin_decision = Column(String, nullable=True)  # cleared/confirmed
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)