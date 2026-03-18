from services.jd_parser import extract_jd_data
import json

sample_jd = """
Data Scientist - Entry Level

We are looking for a Data Scientist to join our analytics team. 
You will work on machine learning models, analyze large datasets, 
and build predictive solutions.

Requirements:
- Bachelor's or Master's degree in Computer Science, Data Science, or related field
- 1-2 years of experience in data science or machine learning
- Proficiency in Python, SQL, and data manipulation libraries (Pandas, NumPy)
- Experience with machine learning frameworks (scikit-learn, TensorFlow, or PyTorch)
- Strong knowledge of statistics and data visualization
- Experience with NLP or time-series analysis is a plus

Preferred:
- Experience with cloud platforms (AWS, Azure)
- Knowledge of deep learning (CNN, LSTM)
- Published research or portfolio projects

Responsibilities:
- Build and deploy machine learning models
- Analyze large datasets to extract actionable insights
- Collaborate with engineering teams on data pipelines
- Present findings to stakeholders
"""

print("Extracting job requirements...\n")
data = extract_jd_data(sample_jd)

if data:
    print(json.dumps(data, indent=2))
else:
    print("Extraction failed!")
