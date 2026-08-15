from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    company = Column(String(255))
    location = Column(String(255))
    salary = Column(String(100))
    description = Column(Text)
    required_skills = Column(Text)  # Comma-separated or JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, index=True)
    candidate_name = Column(String(255))
    candidate_email = Column(String(255))
    resume_text = Column(Text)
    ats_score = Column(Integer)
    match_analysis = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)