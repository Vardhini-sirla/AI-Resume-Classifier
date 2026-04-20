# AI Resume Classifier — Handoff Document

> **Purpose:** This document is a full technical handoff for continuing development.
> Send this file to Claude at the start of a new session and say:
> *"Read HANDOFF.md and continue building the AI Resume Classifier."*

---

## Project Overview

An AI-powered resume shortlisting tool for HR teams. Recruiters upload resumes (PDF/DOCX),
paste a job description, and the system automatically scores and ranks candidates.

**Stack:**
- Frontend: React 19 + Vite 8, Axios, Recharts, Lucide-React
- Backend: Python Flask 3, MongoDB Atlas (PyMongo), OpenAI API
- AI Model: `gpt-4.1-mini` (configurable via `OPENAI_MODEL` env var)
- Deployed backend: `https://ai-resume-classifier-7g4y.onrender.com`
- Local backend: `http://localhost:5000`
- Local frontend: `http://localhost:5173`

---

## Repository Structure

```
Ai-Resume-Classifier/
├── backend/
│   ├── app.py                     # Flask entry point, registers blueprints, logging, index init
│   ├── config.py                  # MongoDB connection pool, get_collections(), ensure_indexes()
│   ├── .env                       # OPENAI_API_KEY, MONGODB_URI, FLASK_DEBUG, OPENAI_MODEL
│   ├── requirements.txt
│   ├── venv/                      # Virtual environment (run with venv/Scripts/python.exe)
│   ├── uploads/                   # Uploaded resume files (UUID-prefixed filenames)
│   ├── models/
│   │   └── resume.py              # create_resume_document() — MongoDB document schema
│   ├── routes/
│   │   ├── upload.py              # POST /api/upload, GET /api/resumes, GET /api/resumes/status
│   │   ├── score.py               # POST /api/score, POST /api/score-all
│   │   ├── delete.py              # DELETE /api/resumes/all, DELETE /api/resumes/<id>
│   │   ├── export.py              # POST /api/export/excel, POST /api/export/pdf
│   │   ├── auth.py                # POST /api/auth/signup, /login, /logout, GET /api/auth/verify
│   │   └── analytics.py           # GET /api/analytics
│   ├── services/
│   │   ├── pdf_parser.py          # parse_resume() — PDF (pdfplumber+PyPDF2) and DOCX extraction
│   │   ├── ai_extractor.py        # extract_resume_data() — GPT structured extraction with retry
│   │   ├── jd_parser.py           # extract_jd_data() — GPT JD requirements extraction with retry
│   │   ├── matcher.py             # match_skills(), match_education(), match_experience()
│   │   └── scorer.py              # calculate_score() — weighted scoring with zero-skills gate
│   └── utils/
│       └── validators.py          # validate_file() — allowed: pdf, docx, doc. Max: 5MB
└── frontend/
    └── src/
        ├── App.jsx                # Main app, routing, state, polling for extraction status
        ├── App.css
        ├── translations.js        # 10 languages: EN, ZH, ES, HI, FR, DE, JA, KO, AR, TE
        └── components/
            ├── AuthPage.jsx
            ├── ResumeUpload.jsx   # Multi-file upload with per-file error feedback
            ├── ResumeList.jsx     # Shows extraction status per resume (extracting/ready/failed)
            ├── JobDescription.jsx # JD textarea + Score button (disabled while extracting)
            ├── ScoreResults.jsx   # Ranked results table
            ├── CandidateModal.jsx # Detailed breakdown modal with radar chart
            ├── AnalyticsPage.jsx  # Multi-chart analytics dashboard
            └── Charts.jsx         # TierPieChart, ScoreBarChart, ScoreDistributionChart, RadarChart
```

---

## MongoDB Collections

**Database:** `resume_classifier`

### `resumes`
```json
{
  "_id": "ObjectId",
  "filename": "original_display_name.pdf",
  "raw_text": "extracted text from PDF/DOCX",
  "file_path": "/uploads/uuid_filename.pdf",
  "parsed_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York, NY",
    "willing_to_relocate": false,
    "skills": ["Python", "Django", "AWS"],
    "experience": [{ "title": "...", "company": "...", "duration": "...", "description": "..." }],
    "education": [{ "degree": "Bachelor of CS", "institution": "MIT", "year": "2019" }],
    "certifications": ["AWS Certified"],
    "total_years_experience": 5.0,
    "veteran_status": false,
    "work_authorization": "US Citizen",
    "availability": "2 weeks",
    "notice_period": "2 weeks"
  },
  "score": 87.5,
  "tier": "Tier 1 - Strong Match",
  "status": "uploaded | extracting | extracted | extraction_failed | scored",
  "uploaded_at": "ISODate"
}
```

### `users`
```json
{ "_id": "ObjectId", "name": "...", "email": "...", "password": "bcrypt_hash", "company": "...", "role": "recruiter", "created_at": "ISODate" }
```

### `sessions`
```json
{ "_id": "ObjectId", "token": "hex32", "user_id": "...", "email": "...", "name": "...", "company": "...", "created_at": "ISODate", "expires_at": "ISODate (7 days TTL)" }
```

---

## Resume Status Lifecycle

```
UPLOAD
  → status: "uploaded"
  → Background ThreadPoolExecutor (max_workers=3) starts extraction immediately

EXTRACTING
  → status: "extracting"
  → GPT-4.1-mini extracts structured data from raw_text
  → On success: status → "extracted", parsed_data populated
  → On failure: status → "extraction_failed"

SCORING
  → POST /api/score-all with JD text
  → Blocked (409) if any resume is still "extracting"
  → GPT parses JD once, local matching runs for all resumes
  → status → "scored", score + tier stored
```

---

## Scoring Algorithm

**Weights (default, user-configurable in Settings):**
- Skills: 60%
- Experience: 30% → 25%
- Education: 20% → 15%

**Skills Score:**
- Required skills match (80% of skills score) + Preferred skills match (20%)
- Word-boundary matching — `"java"` does NOT match `"javascript"`, `"c"` does NOT match `"c#"`
- SKILL_ALIASES dict covers 40+ equivalences (k8s↔kubernetes, ts↔typescript, js↔javascript, etc.)

**Zero-Skills Gate:**
- If candidate matches 0% of required skills AND JD has required skills → score capped at 30%

**Experience Score:**
- `required_years == 0` → 100 (no requirement = anyone qualifies)
- `resume_years >= required_years` → 100
- Otherwise → `(resume_years / required_years) * 100`

**Education Score:**
- Degree levels: High School(1), Associate(2), Bachelor(3), Master(4), PhD(5)
- Also handles: MBA, B.Tech, M.Tech, GED, Diploma, B.S., M.S., etc.
- Meets or exceeds requirement → 100; partial credit otherwise

**Tier Classification:**
- Tier 1 — Strong Match: ≥ 75
- Tier 2 — Potential Match: 50–74
- Tier 3 — Weak Match: < 50

---

## JD Validation

Before scoring, the backend validates the JD has extractable required skills.
If `required_skills` is empty after GPT extraction → 400 error:
> "Job description is too vague to score against. Please include specific required skills..."

JD parser explicitly EXCLUDES generic soft skills ("attention to detail", "communication",
"teamwork", etc.) to prevent them from matching every professional resume.

---

## Running Locally

```bash
# Backend
cd backend
venv/Scripts/python.exe app.py      # Windows
# OR
source venv/bin/activate && python app.py  # Mac/Linux

# Frontend
cd frontend
npm run dev
```

**Environment variables** (`backend/.env`):
```
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://...
FLASK_DEBUG=True
OPENAI_MODEL=gpt-4.1-mini
```

---

## Frontend State (App.jsx key state)

| State | Type | Purpose |
|-------|------|---------|
| `resumes` | array | All uploaded resumes from DB |
| `results` | array | Scored results from last score-all |
| `loading` | bool | Score-all in progress |
| `extractingCount` | number | Resumes still being extracted (drives polling + banner) |
| `weights` | object | `{skills:60, experience:25, education:15}` |
| `user` / `token` | object/string | Auth state (persisted in localStorage) |

**Polling:** When `extractingCount > 0`, `fetchResumes()` is called every 3 seconds via `setInterval`.

---

## Known Limitations / Current Bugs

- Experience scoring uses TOTAL years, not domain-specific years. A software engineer applying for a cleaning job still gets 100% on experience if required_years=0.
- Resumes with complex layouts (heavy graphics, multi-column without tables) may have poor text extraction.
- No deduplication — same resume can be uploaded multiple times.
- Frontend `API_URL` is hardcoded per component (not from a central config file).

---

## 🚀 Feature Roadmap (Priority Order)

### P0 — Highest Impact (Build These First)

#### 1. AI Match Explanation
**What:** After scoring, GPT generates a 2-3 sentence recruiter-style summary per candidate.
> *"Sarah is a strong match — she has 5/5 required skills, 8 years of backend experience at Google, and a CS degree. Main gap: no Docker experience listed."*

**Where to add:**
- `backend/routes/score.py` → `score_all_resumes()`: after `calculate_score()`, call a new `generate_match_summary(resume_data, jd_data, result)` function
- `backend/services/ai_extractor.py`: add `generate_match_summary()` function
- Frontend `CandidateModal.jsx`: display the summary at the top of the modal
- Store in MongoDB: add `match_summary` field to resume document

**Prompt sketch:**
```
You are a senior recruiter. Given this candidate's profile and job requirements,
write a 2-sentence summary explaining why they are or aren't a good fit.
Be specific: mention skill matches/gaps, experience relevance, and education.
Candidate: {parsed_resume}
Job: {jd_data}
Score: {total_score} ({tier})
```

---

#### 2. Interview Question Generator
**What:** For each candidate, generate 5 personalized interview questions targeting skill gaps.

**Where to add:**
- New button in `CandidateModal.jsx`: "Generate Interview Questions"
- New endpoint: `POST /api/interview-questions` with `{resume_id, jd_text}`
- New service: `backend/services/interview_generator.py`

**Prompt sketch:**
```
Generate 5 targeted interview questions for this candidate applying for {job_title}.
Focus on their skill gaps: {missing_skills}.
Mix of behavioral and technical questions.
Format as JSON array: [{"question": "...", "rationale": "..."}]
```

---

#### 3. Semantic Skill Matching with Embeddings
**What:** Replace keyword matching with OpenAI `text-embedding-3-small` cosine similarity.
Catches: "React" ↔ "Frontend UI development", "statistical modeling" ↔ "machine learning".

**Where to add:**
- `backend/services/matcher.py`: add `semantic_skill_match()` using OpenAI embeddings API
- Cache embeddings in MongoDB to avoid re-computing (add `skill_embeddings` field)
- Use as a fallback when keyword matching fails (score > 0.82 cosine similarity = match)

**Implementation sketch:**
```python
from openai import OpenAI
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def get_embedding(text):
    response = client.embeddings.create(model="text-embedding-3-small", input=text)
    return response.data[0].embedding

def semantic_skill_match(req_skill, resume_skills, threshold=0.82):
    req_emb = get_embedding(req_skill)
    for skill in resume_skills:
        res_emb = get_embedding(skill)
        if cosine_similarity(req_emb, res_emb) >= threshold:
            return True
    return False
```

---

#### 4. Duplicate Resume Detection
**What:** On upload, hash the resume text. If hash already exists in DB, reject with a warning.

**Where to add:**
- `backend/routes/upload.py`: compute `hashlib.sha256(raw_text.encode()).hexdigest()`
- Check if hash exists: `collections['resumes'].find_one({'text_hash': hash})`
- Add `text_hash` field to resume document in `models/resume.py`
- Add index on `text_hash` in `config.py` → `ensure_indexes()`

---

### P1 — Strong Product Features

#### 5. Candidate Pipeline Stages
**What:** Move candidates through ATS-style stages.

**Stages:** `Screened → Phone Screen → Technical Interview → Final Round → Offer → Rejected`

**Where to add:**
- Add `pipeline_stage` field to resume MongoDB document (default: `"screened"`)
- New endpoint: `PATCH /api/resumes/<id>/stage` with `{stage: "phone_screen"}`
- Frontend: Kanban-style board OR dropdown in `ScoreResults.jsx` per candidate
- Filter results by stage on dashboard

---

#### 6. Side-by-Side Candidate Comparison
**What:** Select 2-3 candidates → compare skills, experience, education in a structured table.

**Where to add:**
- `frontend/src/components/ComparisonModal.jsx` (new file)
- `ScoreResults.jsx`: add checkboxes, "Compare Selected" button
- Show: skills overlap, missing skills per candidate, experience years, education level

---

#### 7. Skill Gap Heatmap
**What:** Grid showing candidates (rows) × required skills (columns). Green = has skill, Red = missing.

**Where to add:**
- `frontend/src/components/SkillHeatmap.jsx` (new file)
- `frontend/src/App.jsx`: new tab or section below results
- Data already available in `results[].breakdown.details.skills`

---

#### 8. Saved JD Templates
**What:** Save frequently used job descriptions with a name for quick reuse.

**Where to add:**
- New MongoDB collection: `job_templates` `{name, jd_text, created_by, created_at}`
- New endpoints: `POST /api/jd-templates`, `GET /api/jd-templates`, `DELETE /api/jd-templates/<id>`
- `frontend/src/components/JobDescription.jsx`: "Save as Template" button + template dropdown

---

#### 9. WebSockets for Real-time Extraction Updates
**What:** Replace 3-second polling with instant push when a resume finishes extraction.

**How to add:**
- Install: `pip install flask-socketio eventlet`
- `backend/app.py`: init SocketIO, emit `resume_extracted` event after extraction completes
- `frontend/src/App.jsx`: replace `setInterval` with `socket.on('resume_extracted', fetchResumes)`
- Much faster feedback, no wasted polling requests

---

### P2 — Advanced AI Features

#### 10. Bias Detection
**What:** GPT flags if the JD or scoring may have unintentional bias patterns.
Checks: gendered language in JD, over-weighting of prestigious institutions, age proxies.

**Where to add:**
- New endpoint: `POST /api/bias-check` with `{jd_text}`
- New service: `backend/services/bias_checker.py`
- Frontend: yellow warning banner on dashboard if bias detected

---

#### 11. Multi-JD Scoring
**What:** Score the same resume pool against multiple JDs simultaneously.
Useful when hiring for multiple roles at once.

**Where to add:**
- `backend/routes/score.py`: `POST /api/score-multi` accepts `{jd_texts: [...], labels: [...]}`
- Frontend: ability to add multiple JD tabs, switch between result sets

---

#### 12. Resume Quality Score
**What:** GPT rates the resume itself (1-10) on completeness, clarity, formatting — separate from fit.
Helps identify poorly written resumes that might be underselling a good candidate.

**Where to add:**
- `backend/services/ai_extractor.py`: add `score_resume_quality()` function
- Store as `resume_quality_score` in MongoDB
- Display in `CandidateModal.jsx` and `ResumeList.jsx`

---

#### 13. Salary Range Estimator
**What:** Based on candidate's experience, skills, and location, GPT estimates expected salary range.

**Where to add:**
- New service: `backend/services/salary_estimator.py`
- Display in `CandidateModal.jsx`
- Add to Excel/PDF export

---

### P3 — Analytics & Reporting

#### 14. Skill Market Insights
**What:** *"Only 3 of 27 candidates have Kubernetes — this is rare in this pool."*
Highlights which required skills are scarce in the current candidate pool.

**Where to add:**
- `backend/routes/analytics.py`: add `skill_scarcity` calculation
- Compare `required_skills` from last JD against `top_skills` across all resumes
- Display in `AnalyticsPage.jsx` as a new card

---

#### 15. Scoring History / Trends
**What:** Track how pool quality changes across multiple scoring runs (different JDs over time).

**Where to add:**
- New MongoDB collection: `scoring_runs` `{jd_text, jd_data, results_summary, scored_at, scored_by}`
- Store a summary after each `score-all`
- New chart in `AnalyticsPage.jsx`: line chart of avg score / tier distribution over time

---

#### 16. Audit Trail
**What:** Log all actions for HR compliance: who uploaded, who scored, who deleted, when.

**Where to add:**
- New MongoDB collection: `audit_log` `{action, user_id, user_email, target_id, details, timestamp}`
- Middleware or decorator in each route to log actions
- New admin page in frontend to view audit log

---

### P4 — Infrastructure & Production Hardening

#### 17. Centralised API_URL Config (Frontend)
**What:** Currently `API_URL` is hardcoded in 5 separate component files.

**Fix:**
- Create `frontend/src/config.js`: `export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'`
- Replace all hardcoded URLs across: `App.jsx`, `ResumeUpload.jsx`, `ResumeList.jsx`, `AnalyticsPage.jsx`, `AuthPage.jsx`
- Add `VITE_API_URL=https://ai-resume-classifier-7g4y.onrender.com` to `frontend/.env.production`

---

#### 18. Domain-Aware Experience Scoring
**What:** Currently uses total years of experience regardless of domain.
A software engineer applying for a cleaning job gets 100% on experience — wrong.

**Fix:**
- In `ai_extractor.py`: extract `experience_domains` — list of domains per job (e.g. `["software engineering", "backend"]`)
- In `jd_parser.py`: extract `job_domain` (e.g. `"cleaning services"`)
- In `matcher.py`: add `match_experience_domain()` — check domain overlap
- Add to scoring as a modifier: if domain mismatch > threshold, cap experience score at 50

---



#### 20. Email Notifications (Interview Invites)
**What:** Send interview invite emails to Tier 1 candidates directly from the app.

**How:**
- Install: `pip install sendgrid` or use SMTP
- New endpoint: `POST /api/invite` with `{resume_id, message}`
- New button in `CandidateModal.jsx`: "Send Interview Invite"
- Requires candidate email to be extracted (already done in `parsed_data.email`)

---

## Session Summary — What Was Done in This Session

### Bugs Fixed
- **Skill matching false positives**: `"java"` no longer matches `"javascript"`, `"c"` no longer matches `"c#"`. Replaced substring matching with word-boundary token matching + 40+ skill aliases.
- **Weights not sent to backend**: Settings sliders now actually affect scoring. Weights sent with every `score-all` request. Frontend validates they sum to 100.
- **Delete `/all` route shadowed**: Reordered static route before dynamic route.
- **Frontend accepted DOCX but backend rejected it**: Added DOCX support throughout (validator, pdf_parser, upload route).
- **Filename collision race condition**: All uploaded files get UUID prefix.
- **Misplaced import in upload.py**: Moved to top of file.
- **Silent error messages**: `score-all` failures now show the actual server error message.

### Architecture Improvements
- **Background extraction on upload**: Resumes are extracted by GPT immediately on upload using `ThreadPoolExecutor(max_workers=3)`. Score-all is now near-instant after first run.
- **Extraction status tracking**: Status flow: `uploaded → extracting → extracted → scored`
- **Score-all blocked while extracting**: Backend returns 409, frontend shows amber banner and disables button.
- **Real-time polling**: Frontend polls every 3 seconds while any resume is `extracting`.
- **MongoDB connection pooling**: Single cached `MongoClient` instance.
- **MongoDB indexes**: `ensure_indexes()` on startup for `resumes.status`, `resumes.uploaded_at`, `users.email` (unique), `sessions.token` (unique), `sessions.expires_at` (TTL).

### AI / Scoring Improvements
- **Upgraded to `gpt-4.1-mini`**: Configurable via `OPENAI_MODEL` env var.
- **Rewritten GPT prompts**: More specific system prompts for both resume extractor and JD parser. `temperature=0.0`, token budget guards.
- **Schema validation**: Every extracted field gets a safe default if GPT omits it.
- **Retry logic**: 3 retries with exponential backoff on `RateLimitError` / `APIError`.
- **Proper logging**: `logging.basicConfig` replaces bare `print()` calls.
- **Zero-skills gate**: If candidate matches 0% of required skills, score capped at 30% (always Tier 3).
- **JD validation**: Score-all blocked if JD extracts no required skills ("too vague").
- **Soft skills excluded from JD**: JD parser explicitly told NOT to extract "attention to detail", "communication", "teamwork", etc. — prevents them matching all professional resumes.
- **Default weights changed**: 60/25/15 (skills weighted higher as it's most domain-specific).
- **Expanded education levels**: Added MBA, B.Tech, M.Tech, GED, Diploma, B.S., M.S., Ph.D, etc.
- **Structural logging**: All route handlers log key events with `logger.info/error`.

---

## How to Continue

Send this file to Claude with:

> *"Here is the handoff document for the AI Resume Classifier project: [paste HANDOFF.md].
> I want to implement [feature name from roadmap]. Please read the architecture,
> understand the current state, and build it."*

Claude will read the file structure, data models, and current implementation details
and can continue building without needing to re-explore the codebase from scratch.
