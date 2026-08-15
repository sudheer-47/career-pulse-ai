from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import Base, engine, get_db
from app.models import Job, Application
from app.schemas import JobCreate, JobOut, ResumeAnalysisResponse, CoverLetterResponse
from app.ai_services import extract_text_from_pdf, analyze_resume_ats, generate_cover_letter

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Powered Job Portal API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Seed initial jobs if empty
@app.on_event("startup")
def seed_jobs():
    db = next(get_db())
    if db.query(Job).count() == 0:
        sample_jobs = [
            Job(
                title="Junior Python Developer",
                company="Nexus Tech",
                location="Remote",
                salary="$70,000 - $85,000",
                description="We are seeking a Junior Python Developer skilled in FastAPI, SQL, and REST APIs. Experience with cloud tools and Docker is a plus.",
                required_skills="Python, FastAPI, SQL, Git, REST APIs"
            ),
            Job(
                title="AI / ML Engineer Intern",
                company="Cognitive Labs",
                location="Bengaluru / Hybrid",
                salary="₹6,00,000 - ₹9,00,000",
                description="Join our AI engineering team to build LLM pipelines, RAG systems, and data extraction pipelines using LangChain and Gemini.",
                required_skills="Python, LLMs, PyTorch, LangChain, Vector Databases"
            )
        ]
        db.add_all(sample_jobs)
        db.commit()

# 2. Get all jobs
@app.get("/api/jobs", response_model=List[JobOut])
def get_all_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.created_at.desc()).all()

# 3. Create a new job
@app.post("/api/jobs", response_model=JobOut)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(**job_in.dict())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

# 4. AI ATS Resume Analysis Endpoint
@app.post("/api/ai/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    job_id: int = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    pdf_bytes = await resume_file.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the uploaded PDF.")

    analysis = analyze_resume_ats(
        resume_text=resume_text,
        job_description=f"{job.title} - {job.description}\nRequired Skills: {job.required_skills}"
    )
    return analysis

# 5. AI Cover Letter Generator Endpoint
@app.post("/api/ai/generate-cover-letter", response_model=CoverLetterResponse)
async def make_cover_letter(
    job_id: int = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    pdf_bytes = await resume_file.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    cover_letter = generate_cover_letter(
        resume_text=resume_text,
        job_title=job.title,
        company=job.company,
        job_description=job.description
    )
    return {"cover_letter": cover_letter}
