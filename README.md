# AI Resume Classifier

An AI-powered resume shortlisting tool that helps HR teams automatically classify and rank candidates based on job descriptions.

## Features
- **PDF Resume Upload** — Upload single or multiple resumes
- **AI-Powered Extraction** — OpenAI extracts skills, experience, and education
- **Smart Scoring** — 50/30/20 weighted scoring (Skills/Experience/Education)
- **Tier Classification** — Tier 1 (Strong), Tier 2 (Potential), Tier 3 (Weak)
- **HR Dashboard** — Professional sidebar layout with stats and filters
- **Candidate Detail Modal** — Click any candidate to see full breakdown
- **Export Results** — Download rankings as Excel or PDF
- **Delete Management** — Remove individual or all resumes

## Tech Stack
- **Frontend:** React + Vite, Axios, Lucide Icons
- **Backend:** Python + Flask, Flask-CORS
- **Database:** MongoDB Atlas
- **AI:** OpenAI GPT-3.5 Turbo
- **PDF Parsing:** PyPDF2 + pdfplumber
- **Export:** openpyxl (Excel), ReportLab (PDF)

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `backend/.env` with:
```
OPENAI_API_KEY=your_key_here
MONGODB_URI=your_mongodb_connection_string
FLASK_DEBUG=True
```

## API Endpoints
- `GET /health` — Health check
- `GET /api/db-test` — Database connection test
- `POST /api/upload` — Upload a resume PDF
- `GET /api/resumes` — List all resumes
- `DELETE /api/resumes/<id>` — Delete a resume
- `DELETE /api/resumes/all` — Delete all resumes
- `POST /api/score` — Score a single resume against a JD
- `POST /api/score-all` — Score all resumes against a JD
- `POST /api/export/excel` — Export results as Excel
- `POST /api/export/pdf` — Export results as PDF

## Scoring System
| Category | Weight | Description |
|----------|--------|-------------|
| Skills | 50% | Required + preferred skills match |
| Experience | 30% | Years of experience match |
| Education | 20% | Education level match |

## Tier Classification
| Tier | Score Range | Label |
|------|------------|-------|
| Tier 1 | 75-100 | Strong Match |
| Tier 2 | 50-74 | Potential Match |
| Tier 3 | 0-49 | Weak Match |

## Built By
Vardhini Sirla





