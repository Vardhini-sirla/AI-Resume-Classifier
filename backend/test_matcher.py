from services.matcher import match_skills, match_education, match_experience
import json

# Sample resume data (like what AI extracted from your resume)
resume_skills = ["Python", "SQL", "Pandas", "NumPy", "scikit-learn", 
                 "TensorFlow", "PyTorch", "CNN", "LSTM", "NLP",
                 "AWS", "Azure", "machine learning", "OpenCV"]

resume_education = [
    {"degree": "Master of Science", "institution": "Clark University", "year": "2024-2026"},
    {"degree": "Bachelor of Technology", "institution": "Centurion University", "year": "2021-2025"}
]

resume_experience_years = 1

# Sample job requirements
required_skills = ["Python", "SQL", "Pandas", "NumPy", "scikit-learn", 
                   "TensorFlow", "PyTorch", "statistics", "data visualization"]
preferred_skills = ["AWS", "Azure", "deep learning"]
required_education = "Bachelor's or Master's degree"
required_experience = 1

# Run matching
skills_result = match_skills(resume_skills, required_skills, preferred_skills)
edu_result = match_education(resume_education, required_education)
exp_result = match_experience(resume_experience_years, required_experience)

print("=== SKILLS MATCH ===")
print(json.dumps(skills_result, indent=2))
print("\n=== EDUCATION MATCH ===")
print(json.dumps(edu_result, indent=2))
print("\n=== EXPERIENCE MATCH ===")
print(json.dumps(exp_result, indent=2))