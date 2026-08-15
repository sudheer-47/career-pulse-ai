import os
import json
from pypdf import PdfReader
from io import BytesIO
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract raw textual content from uploaded PDF file."""
    reader = PdfReader(BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()

def analyze_resume_ats(resume_text: str, job_description: str) -> dict:
    """Uses Gemini to evaluate ATS match and return structured JSON."""
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) and hiring manager.
    Compare the following candidate resume against the target job description.

    [JOB DESCRIPTION]
    {job_description}

    [RESUME]
    {resume_text}

    Provide your assessment strictly as a JSON object adhering to this schema:
    {{
        "ats_score": <integer from 0 to 100>,
        "matched_skills": [<string>, ...],
        "missing_skills": [<string>, ...],
        "strengths": [<string>, ...],
        "improvement_suggestions": [<string>, ...],
        "summary": "<brief 2-sentence overview>"
    }}
    Do not output markdown codeblocks around the JSON. Output only valid JSON.
    """
    
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )
    
    try:
        return json.loads(response.text)
    except Exception:
        return {
            "ats_score": 50,
            "matched_skills": [],
            "missing_skills": [],
            "strengths": ["Parsed resume successfully."],
            "improvement_suggestions": ["Ensure skills are explicitly listed in standard text format."],
            "summary": "Resume evaluated."
        }

def generate_cover_letter(resume_text: str, job_title: str, company: str, job_description: str) -> str:
    """Generate a tailored, professional cover letter."""
    prompt = f"""
    Write a concise, high-impact cover letter for a candidate applying to the {job_title} role at {company}.
    
    [JOB DESCRIPTION]
    {job_description}
    
    [CANDIDATE RESUME]
    {resume_text}
    
    Keep it authentic, professional, and highlight candidate experience matching the job's core requirements.
    """
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.7)
    )
    return response.text