from services.scorer import calculate_score
import json

# Your resume data (from AI extraction)
resume_data = {
    "skills": ["Python", "SQL", "Pandas", "NumPy", "scikit-learn",
               "TensorFlow", "PyTorch", "CNN", "LSTM", "NLP",
               "AWS", "Azure", "machine learning", "OpenCV"],
    "education": [
        {"degree": "Master of Science", "institution": "Clark University", "year": "2024-2026"},
        {"degree": "Bachelor of Technology", "institution": "Centurion University", "year": "2021-2025"}
    ],
    "total_years_experience": 1
}

# Job description data
jd_data = {
    "job_title": "Data Scientist - Entry Level",
    "required_skills": ["Python", "SQL", "Pandas", "NumPy", "scikit-learn",
                        "TensorFlow", "PyTorch", "statistics", "data visualization"],
    "preferred_skills": ["AWS", "Azure", "deep learning"],
    "required_experience_years": 1,
    "required_education": "Bachelor's or Master's degree"
}

result = calculate_score(resume_data, jd_data)

print(f"TOTAL SCORE: {result['total_score']}/100")
print(f"TIER: {result['tier']}")
print(f"\nBreakdown:")
print(f"  Skills:     {result['breakdown']['skills_score']}/100 (50% weight)")
print(f"  Experience: {result['breakdown']['experience_score']}/100 (30% weight)")
print(f"  Education:  {result['breakdown']['education_score']}/100 (20% weight)")
print(f"\nMatched Skills: {result['details']['skills']['required_matched']}")
print(f"Missing Skills: {result['details']['skills']['required_missing']}")
