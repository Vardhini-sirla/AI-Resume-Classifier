from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_jd_data(jd_text):
    """Use OpenAI to extract structured requirements from a job description"""
    
    prompt = f"""Analyze the following job description and extract the requirements in JSON format.
Return ONLY valid JSON with no extra text. Use this exact structure:

{{
    "job_title": "Title of the position",
    "required_skills": ["skill1", "skill2", "skill3"],
    "preferred_skills": ["skill1", "skill2"],
    "required_experience_years": 0,
    "required_education": "Minimum education level (e.g., Bachelor's, Master's)",
    "key_responsibilities": ["responsibility1", "responsibility2"]
}}

Job Description:
{jd_text}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a job description parser. Return only valid JSON, no markdown, no extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        result = response.choices[0].message.content.strip()
        
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