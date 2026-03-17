from datetime import datetime

def create_resume_document(filename, raw_text, file_path):
    """Creates a properly structured resume document for MongoDB"""
    return {
        "filename": filename,
        "raw_text": raw_text,
        "file_path": file_path,
        "parsed_data": {
            "skills": [],
            "experience": [],
            "education": [],
            "name": "",
            "email": "",
            "phone": ""
        },
        "score": None,
        "tier": None,
        "uploaded_at": datetime.utcnow(),
        "status": "uploaded"
    }
