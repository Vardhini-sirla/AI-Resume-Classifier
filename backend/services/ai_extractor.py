from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_resume_data(raw_text):
    """Use OpenAI to extract structured data from resume text"""
    
    prompt = f"""Analyze the following resume text and extract information in JSON format.
Return ONLY valid JSON with no extra text. Use this exact structure:

{{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number or empty string",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Start - End",
            "description": "Brief summary of role"
        }}
    ],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "School Name",
            "year": "Year or range"
        }}
    ],
    "total_years_experience": 0
}}

Resume text:
{raw_text}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a resume parser. Return only valid JSON, no markdown, no extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip()
        
        # Clean up if wrapped in markdown code blocks
        if result.startswith("```"):
            result = result.split("\n", 1)[1]
            result = result.rsplit("```", 1)[0]
        
        parsed = json.loads(result)
        return parsed
    
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"OpenAI error: {e}")
        return None