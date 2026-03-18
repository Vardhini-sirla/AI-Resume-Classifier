# AI Resume Classifier

An AI-powered resume shortlisting tool that helps HR teams automatically classify and rank candidates.

## Tech Stack
- Frontend: React + Vite
- Backend: Python + Flask
- Database: MongoDB Atlas
- PDF Parsing: PyPDF2 + pdfplumber

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

### Week 1 Features
- Resume PDF upload via browser
- PDF text extraction (PyPDF2 + pdfplumber)
- MongoDB storage for resume data
- REST API endpoints (upload, list, health check)
- React frontend with upload UI

### Coming Soon
- AI-powered skills/experience extraction (Week 2)
- Weighted scoring & tier classification (Week 2)
- HR dashboard with filtering (Week 3)
- Cloud deployment (Week 4)



