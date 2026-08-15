from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str
    company: str
    location: str
    salary: str
    description: str
    required_skills: str

class JobCreate(JobBase):
    pass

class JobOut(JobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeAnalysisResponse(BaseModel):
    ats_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    improvement_suggestions: List[str]
    summary: str

class CoverLetterResponse(BaseModel):
    cover_letter: str