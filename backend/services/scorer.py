from services.matcher import match_skills, match_education, match_experience

def calculate_score(resume_data, jd_data):
    """Calculate weighted score: Skills 50%, Experience 30%, Education 20%"""
    
    # Skills matching (50% weight)
    skills_result = match_skills(
        resume_data.get("skills", []),
        jd_data.get("required_skills", []),
        jd_data.get("preferred_skills", [])
    )
    
    # Required skills worth 80% of skills score, preferred worth 20%
    required_pct = skills_result["required_match_percentage"]
    preferred_pct = skills_result["preferred_match_percentage"]
    skills_score = (required_pct * 0.8) + (preferred_pct * 0.2)
    
    # Experience matching (30% weight)
    resume_years = resume_data.get("total_years_experience", 0)
    required_years = jd_data.get("required_experience_years", 0)
    
    exp_result = match_experience(resume_years, required_years)
    
    if required_years == 0:
        experience_score = 100
    elif resume_years >= required_years:
        experience_score = 100
    elif resume_years > 0:
        experience_score = (resume_years / required_years) * 100
    else:
        experience_score = 0
    
    # Education matching (20% weight)
    edu_result = match_education(
        resume_data.get("education", []),
        jd_data.get("required_education", "")
    )
    
    if edu_result["meets_requirement"]:
        education_score = 100
    elif edu_result["resume_level"] > 0:
        education_score = (edu_result["resume_level"] / max(edu_result["required_level"], 1)) * 100
    else:
        education_score = 0
    
    # Weighted total
    total_score = round(
        (skills_score * 0.50) +
        (experience_score * 0.30) +
        (education_score * 0.20),
        1
    )
    
    # Tier classification
    if total_score >= 75:
        tier = "Tier 1 - Strong Match"
    elif total_score >= 50:
        tier = "Tier 2 - Potential Match"
    else:
        tier = "Tier 3 - Weak Match"
    
    return {
        "total_score": total_score,
        "tier": tier,
        "breakdown": {
            "skills_score": round(skills_score, 1),
            "experience_score": round(experience_score, 1),
            "education_score": round(education_score, 1),
            "weights": "Skills 50% | Experience 30% | Education 20%"
        },
        "details": {
            "skills": skills_result,
            "experience": exp_result,
            "education": edu_result
        }
    }