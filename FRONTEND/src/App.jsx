import React, { useRef, useState } from "react";

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [activeTab, setActiveTab] = useState("ats");

  const [loading, setLoading] = useState(false);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [apiError, setApiError] = useState("");

  const fileInputRef = useRef(null);

  const API_BASE = "https://career-pulse-api-hah2.onrender.com/api";

  /* =========================
     SAMPLE JOB PRESETS
  ========================= */

  const samplePresets = [
    {
      title: "Python Fullstack Engineer",
      desc:
        "Requirements: 2+ years experience with Python, FastAPI or Django, PostgreSQL, REST APIs. Familiarity with React, Docker, and LLM/OpenAI integrations is a plus.",
    },
    {
      title: "AI / ML Solutions Engineer",
      desc:
        "Requirements: Proficient in Python, LangChain, vector databases (pgvector/Pinecone), PyTorch, building RAG systems, and deploying async microservices.",
    },
  ];

  /* =========================
     FILE HANDLING
  ========================= */

  const handleFile = (file) => {
    if (!file) return;

    setApiError("");

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF resume.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
      return;
    }

    setResumeFile(file);
    setResumeFileName(file.name);
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    setDragActive(false);

    handleFile(e.dataTransfer.files?.[0]);
  };

  const resetResume = () => {
    setResumeFile(null);
    setResumeFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================
     READ API ERROR
  ========================= */

  const getApiErrorMessage = async (response) => {
    try {
      const data = await response.json();

      if (data.detail) {
        if (typeof data.detail === "string") {
          return data.detail;
        }

        return JSON.stringify(data.detail);
      }

      if (data.message) {
        return data.message;
      }

      if (data.error) {
        return data.error;
      }

      return `Server returned error ${response.status}`;
    } catch {
      return `Server returned error ${response.status}`;
    }
  };

  /* =========================
     ANALYZE RESUME
  ========================= */

  const handleScanResume = async () => {
    setApiError("");

    if (!resumeFile) {
      alert("Please upload your PDF resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please enter or select a job description.");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setActiveTab("ats");

    const formData = new FormData();

    formData.append("job_id", "1");
    formData.append("resume_file", resumeFile);

    /*
      IMPORTANT:
      Send the job description as well.

      If your backend accepts this field,
      it can use the exact description entered
      by the user.
    */
    formData.append("job_description", jobDescription);

    try {
      const response = await fetch(
        `${API_BASE}/ai/analyze-resume`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorMessage =
          await getApiErrorMessage(response);

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setAnalysis(data);

      setTimeout(() => {
        document
          .getElementById("analysis-results")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 150);
    } catch (error) {
      console.error("Resume analysis error:", error);

      setApiError(
        error.message ||
          "Unable to analyze the resume."
      );

      alert(
        `Resume analysis failed.\n\n${
          error.message ||
          "Check whether the FastAPI backend is running."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GENERATE COVER LETTER
  ========================= */

  const handleGenerateCoverLetter = async () => {
    setApiError("");

    if (!resumeFile) {
      alert("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      alert(
        "Please enter or select a job description first."
      );
      return;
    }

    setCoverLetterLoading(true);
    setActiveTab("letter");

    const formData = new FormData();

    /*
      Existing backend parameters
    */
    formData.append("job_id", "1");
    formData.append("resume_file", resumeFile);

    /*
      NEW:
      Send the target job description.
    */
    try {
      console.log(
        "Generating cover letter..."
      );

      const response = await fetch(
        `${API_BASE}/ai/generate-cover-letter`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(
        "Cover letter status:",
        response.status
      );

      if (!response.ok) {
        const errorMessage =
          await getApiErrorMessage(response);

        throw new Error(errorMessage);
      }

      const data = await response.json();

      console.log(
        "Cover letter response:",
        data
      );

      if (!data.cover_letter) {
        throw new Error(
          "The server did not return a cover letter."
        );
      }

      setCoverLetter(data.cover_letter);
      setApiError("");

      setTimeout(() => {
        document
          .getElementById("analysis-results")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 150);
    } catch (error) {
      console.error(
        "Cover letter generation error:",
        error
      );

      setCoverLetter("");

      const message =
        error.message ||
        "Unable to generate the cover letter.";

      setApiError(message);

      /*
        Show the REAL backend error instead
        of only "Failed to create cover letter".
      */
      alert(
        `Failed to create cover letter.\n\n${message}`
      );
    } finally {
      setCoverLetterLoading(false);
    }
  };

  /* =========================
     COPY COVER LETTER
  ========================= */

  const copyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(
        coverLetter
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );

      alert(
        "Unable to copy the cover letter."
      );
    }
  };

  return (
    <div className="career-app">

      {/* BACKGROUND */}

      <div className="ambient-glow ambient-glow-one"></div>

      <div className="ambient-glow ambient-glow-two"></div>

      <div className="grid-background"></div>


      {/* =========================
          NAVBAR
      ========================= */}

      <header className="top-navbar">

        <div className="nav-inner">

          <div className="brand">

            <div className="brand-icon">
              <i className="bi bi-cpu-fill"></i>
            </div>

            <div className="brand-name">
              Career<span>Pulse</span>
            </div>

            <span className="version-badge">
              AI 2.5
            </span>

          </div>


          <div className="nav-status">

            <span className="status-dot"></span>

            <span>
              FastAPI + Gemini
            </span>

            <span className="status-active">
              ACTIVE
            </span>

          </div>

        </div>

      </header>


      {/* =========================
          MAIN
      ========================= */}

      <main>

        {/* HERO */}

        <section className="hero-section">

          <div className="hero-badge">

            <span className="sparkle">
              ✦
            </span>

            AI-POWERED RESUME INTELLIGENCE

          </div>


          <h1>

            Optimize Your Resume

            <br />

            <span>
              For Your Next Job
            </span>

          </h1>


          <p className="hero-description">

            Upload your resume, add the target job
            description, and let AI analyze your
            compatibility, identify missing skills,
            and create a tailored cover letter.

          </p>


          <div className="hero-features">

            <div>
              <i className="bi bi-check-circle-fill"></i>
              ATS Analysis
            </div>

            <div>
              <i className="bi bi-check-circle-fill"></i>
              Skill Matching
            </div>

            <div>
              <i className="bi bi-check-circle-fill"></i>
              AI Cover Letter
            </div>

          </div>

        </section>


        {/* =========================
            WORKSPACE
        ========================= */}

        <section className="workspace-section">

          <div className="workflow-header">

            <div>

              <span className="section-eyebrow">
                YOUR WORKFLOW
              </span>

              <h2>
                Analyze your resume
              </h2>

            </div>


            <div className="workflow-steps">

              <div className="workflow-step active">
                <span>01</span>
                Resume
              </div>

              <div className="step-line"></div>

              <div
                className={`workflow-step ${
                  jobDescription
                    ? "active"
                    : ""
                }`}
              >
                <span>02</span>
                Target Job
              </div>

              <div className="step-line"></div>

              <div
                className={`workflow-step ${
                  analysis
                    ? "active"
                    : ""
                }`}
              >
                <span>03</span>
                Results
              </div>

            </div>

          </div>


          {/* INPUT CARDS */}

          <div className="input-grid">


            {/* RESUME */}

            <div className="input-card">

              <div className="card-top">

                <div className="step-number">
                  01
                </div>

                <div>

                  <h3>
                    Upload Resume
                  </h3>

                  <p>
                    Upload your latest candidate resume
                  </p>

                </div>

              </div>


              <div
                className={`upload-zone ${
                  dragActive
                    ? "drag-active"
                    : ""
                } ${
                  resumeFile
                    ? "file-selected"
                    : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  hidden
                />


                {resumeFile ? (

                  <>

                    <div className="upload-success-icon">

                      <i className="bi bi-file-earmark-pdf-fill"></i>

                    </div>


                    <div className="selected-file">

                      <strong>
                        {resumeFileName}
                      </strong>

                      <span>

                        <i className="bi bi-check-circle-fill"></i>

                        Ready for analysis

                      </span>

                    </div>


                    <button
                      type="button"
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetResume();
                      }}
                    >

                      <i className="bi bi-x-lg"></i>

                    </button>

                  </>

                ) : (

                  <>

                    <div className="upload-icon">

                      <i className="bi bi-cloud-arrow-up"></i>

                    </div>


                    <h4>
                      Drop your resume here
                    </h4>


                    <p>

                      or{" "}
                      <span>
                        browse your files
                      </span>

                    </p>


                    <small>
                      PDF only · Maximum file size 10MB
                    </small>

                  </>

                )}

              </div>


              <div className="card-hint">

                <i className="bi bi-shield-check"></i>

                Your resume is processed securely
                for analysis.

              </div>

            </div>


            {/* TARGET JOB */}

            <div className="input-card">

              <div className="card-top">

                <div className="step-number cyan">
                  02
                </div>

                <div>

                  <h3>
                    Target Job
                  </h3>

                  <p>
                    Paste the job description you want to match
                  </p>

                </div>

              </div>


              <div className="preset-row">

                <span>
                  Quick presets
                </span>


                <div className="preset-buttons">

                  {samplePresets.map(
                    (preset, idx) => (

                      <button
                        key={idx}
                        type="button"
                        className={
                          jobDescription ===
                          preset.desc
                            ? "preset active"
                            : "preset"
                        }
                        onClick={() =>
                          setJobDescription(
                            preset.desc
                          )
                        }
                      >

                        Preset {idx + 1}

                      </button>

                    )
                  )}

                </div>

              </div>


              <div className="textarea-wrapper">

                <textarea
                  placeholder="Paste the job description, required skills, responsibilities, technologies..."
                  value={jobDescription}
                  onChange={(e) =>
                    setJobDescription(
                      e.target.value
                    )
                  }
                ></textarea>


                <div className="textarea-footer">

                  <span>

                    <i className="bi bi-briefcase"></i>

                    Job requirements

                  </span>


                  <span>
                    {jobDescription.length} characters
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* =========================
              ERROR MESSAGE
          ========================= */}

          {apiError && (

            <div className="api-error-box">

              <div className="api-error-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>

              <div>

                <strong>
                  API Error
                </strong>

                <p>
                  {apiError}
                </p>

              </div>

              <button
                type="button"
                onClick={() => setApiError("")}
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>

          )}


          {/* =========================
              ACTION BAR
          ========================= */}

          <div className="action-bar">

            <div className="analysis-info">

              <div className="info-icon">
                <i className="bi bi-stars"></i>
              </div>

              <div>

                <strong>
                  AI-powered analysis
                </strong>

                <span>
                  Semantic ATS matching with Gemini AI
                </span>

              </div>

            </div>


            <div className="action-buttons">


              {/* COVER LETTER */}

              <button
                className="secondary-action"
                onClick={handleGenerateCoverLetter}
                disabled={
                  coverLetterLoading ||
                  loading ||
                  !resumeFile ||
                  !jobDescription.trim()
                }
              >

                {coverLetterLoading ? (

                  <>
                    <span className="spinner-border spinner-border-sm"></span>

                    Creating...

                  </>

                ) : (

                  <>

                    <i className="bi bi-file-earmark-text"></i>

                    Generate Cover Letter

                  </>

                )}

              </button>


              {/* ATS */}

              <button
                className="primary-action"
                onClick={handleScanResume}
                disabled={
                  loading ||
                  coverLetterLoading ||
                  !resumeFile ||
                  !jobDescription.trim()
                }
              >

                {loading ? (

                  <>

                    <span className="spinner-border spinner-border-sm"></span>

                    Analyzing...

                  </>

                ) : (

                  <>

                    Analyze Resume

                    <i className="bi bi-arrow-right"></i>

                  </>

                )}

              </button>

            </div>

          </div>

        </section>


        {/* =========================
            RESULTS
        ========================= */}

        {(analysis || coverLetter) && (

          <section
            id="analysis-results"
            className="results-section"
          >


            {/* RESULTS HEADER */}

            <div className="results-header">

              <div>

                <span className="section-eyebrow">
                  AI ANALYSIS
                </span>

                <h2>
                  Resume Alignment
                </h2>

                {analysis && (

                  <p>
                    {analysis.summary}
                  </p>

                )}

              </div>


              {analysis && (

                <div className="score-card">

                  <div
                    className="score-ring"
                    style={{
                      "--score":
                        `${analysis.ats_score}%`,
                    }}
                  >

                    <div className="score-inner">

                      <strong>
                        {analysis.ats_score}
                      </strong>

                      <span>
                        /100
                      </span>

                    </div>

                  </div>


                  <div className="score-label">

                    <strong>
                      ATS Score
                    </strong>

                    <span>
                      Overall match
                    </span>

                  </div>

                </div>

              )}

            </div>


            {/* TABS */}

            <div className="result-tabs">

              {analysis && (

                <>

                  <button
                    className={
                      activeTab === "ats"
                        ? "result-tab active"
                        : "result-tab"
                    }
                    onClick={() =>
                      setActiveTab("ats")
                    }
                  >

                    <i className="bi bi-bar-chart-fill"></i>

                    Skill Matrix

                  </button>


                  <button
                    className={
                      activeTab === "tips"
                        ? "result-tab active"
                        : "result-tab"
                    }
                    onClick={() =>
                      setActiveTab("tips")
                    }
                  >

                    <i className="bi bi-lightbulb-fill"></i>

                    Recommendations

                  </button>

                </>

              )}


              {coverLetter && (

                <button
                  className={
                    activeTab === "letter"
                      ? "result-tab active"
                      : "result-tab"
                  }
                  onClick={() =>
                    setActiveTab("letter")
                  }
                >

                  <i className="bi bi-file-earmark-text-fill"></i>

                  Cover Letter

                </button>

              )}

            </div>


            {/* =========================
                SKILL MATRIX
            ========================= */}

            {analysis &&
              activeTab === "ats" && (

                <div className="result-grid">


                  <div className="result-card matched-card">

                    <div className="result-card-heading">

                      <div className="result-icon success">

                        <i className="bi bi-check-lg"></i>

                      </div>

                      <div>

                        <h3>
                          Matched Skills
                        </h3>

                        <span>
                          {
                            analysis.matched_skills
                              ?.length || 0
                          }{" "}
                          skills found
                        </span>

                      </div>

                    </div>


                    <div className="skills-list">

                      {analysis.matched_skills?.map(
                        (skill, idx) => (

                          <span
                            key={idx}
                            className="skill matched"
                          >

                            <i className="bi bi-check2"></i>

                            {skill}

                          </span>

                        )
                      )}

                    </div>

                  </div>


                  <div className="result-card missing-card">

                    <div className="result-card-heading">

                      <div className="result-icon warning">

                        <i className="bi bi-exclamation-lg"></i>

                      </div>

                      <div>

                        <h3>
                          Missing Skills
                        </h3>

                        <span>
                          {
                            analysis.missing_skills
                              ?.length || 0
                          }{" "}
                          recommended
                        </span>

                      </div>

                    </div>


                    <div className="skills-list">

                      {analysis.missing_skills?.map(
                        (skill, idx) => (

                          <span
                            key={idx}
                            className="skill missing"
                          >

                            <i className="bi bi-plus"></i>

                            {skill}

                          </span>

                        )
                      )}

                    </div>

                  </div>

                </div>

              )}


            {/* =========================
                RECOMMENDATIONS
            ========================= */}

            {analysis &&
              activeTab === "tips" && (

                <div className="recommendations-card">

                  <div className="recommendations-heading">

                    <div className="result-icon purple">

                      <i className="bi bi-lightbulb-fill"></i>

                    </div>

                    <div>

                      <h3>
                        Optimization Suggestions
                      </h3>

                      <span>
                        Improve your resume alignment
                      </span>

                    </div>

                  </div>


                  <div className="recommendations-list">

                    {analysis.improvement_suggestions?.map(
                      (item, idx) => (

                        <div
                          className="recommendation"
                          key={idx}
                        >

                          <div className="recommendation-number">
                            {idx + 1}
                          </div>

                          <p>
                            {item}
                          </p>

                          <i className="bi bi-arrow-up-right"></i>

                        </div>

                      )
                    )}

                  </div>

                </div>

              )}


            {/* =========================
                COVER LETTER
            ========================= */}

            {activeTab === "letter" &&
              coverLetter && (

                <div className="cover-letter-card">

                  <div className="cover-letter-header">

                    <div>

                      <span className="section-eyebrow">
                        AI GENERATED
                      </span>

                      <h3>
                        Tailored Cover Letter
                      </h3>

                    </div>


                    <button
                      className="copy-button"
                      onClick={copyCoverLetter}
                    >

                      <i
                        className={
                          copied
                            ? "bi bi-check-lg"
                            : "bi bi-copy"
                        }
                      ></i>

                      {copied
                        ? "Copied!"
                        : "Copy"}

                    </button>

                  </div>


                  <pre>
                    {coverLetter}
                  </pre>

                </div>

              )}

          </section>

        )}

      </main>


      {/* =========================
          FOOTER
      ========================= */}

      <footer className="footer">

        <div>

          <strong>
            CareerPulse AI
          </strong>

          <span>
            Python Full Stack · FastAPI · Gemini
          </span>

        </div>

        <span>
          Built for smarter job applications
        </span>

      </footer>

    </div>
  );
}