from services.pdf_parser import parse_resume
from services.ai_extractor import extract_resume_data
import json

# Parse your resume
raw_text = parse_resume("uploads/Resume_v.pdf")
print("Extracting data with AI...\n")

# Extract with AI
data = extract_resume_data(raw_text)

if data:
    print(json.dumps(data, indent=2))
else:
    print("Extraction failed!")
    