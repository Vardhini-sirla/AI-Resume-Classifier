def normalize_skill(skill):
    """Normalize skill names for better matching"""
    return skill.lower().strip().replace("-", " ").replace("_", " ")

def match_skills(resume_skills, required_skills, preferred_skills=None):
    """Compare resume skills against job requirements"""
    
    resume_normalized = [normalize_skill(s) for s in resume_skills]
    required_normalized = [normalize_skill(s) for s in required_skills]
    preferred_normalized = [normalize_skill(s) for s in (preferred_skills or [])]
    
    # Check required skills
    required_matched = []
    required_missing = []
    for skill in required_normalized:
        found = False
        for r_skill in resume_normalized:
            if skill in r_skill or r_skill in skill:
                required_matched.append(skill)
                found = True
                break
        if not found:
            required_missing.append(skill)
    
    # Check preferred skills
    preferred_matched = []
    for skill in preferred_normalized:
        for r_skill in resume_normalized:
            if skill in r_skill or r_skill in skill:
                preferred_matched.append(skill)
                break
    
    # Calculate match percentages
    required_match_pct = (len(required_matched) / len(required_normalized) * 100) if required_normalized else 0
    preferred_match_pct = (len(preferred_matched) / len(preferred_normalized) * 100) if preferred_normalized else 0
    
    return {
        "required_matched": required_matched,
        "required_missing": required_missing,
        "preferred_matched": preferred_matched,
        "required_match_percentage": round(required_match_pct, 1),
        "preferred_match_percentage": round(preferred_match_pct, 1)
    }

def match_education(resume_education, required_education):
    """Check if resume meets education requirements"""
    edu_levels = {
        "high school": 1,
        "associate": 2,
        "bachelor": 3,
        "master": 4,
        "phd": 5,
        "doctorate": 5
    }
    
    # Find highest education in resume
    resume_level = 0
    for edu in resume_education:
        degree = edu.get("degree", "").lower()
        for level_name, level_num in edu_levels.items():
            if level_name in degree:
                resume_level = max(resume_level, level_num)
    
    # Find required level
    required_level = 0
    required_lower = required_education.lower()
    for level_name, level_num in edu_levels.items():
        if level_name in required_lower:
            required_level = max(required_level, level_num)
    
    meets_requirement = resume_level >= required_level
    
    return {
        "meets_requirement": meets_requirement,
        "resume_level": resume_level,
        "required_level": required_level
    }

def match_experience(resume_years, required_years):
    """Check if resume meets experience requirements"""
    meets_requirement = resume_years >= required_years
    
    return {
        "meets_requirement": meets_requirement,
        "resume_years": resume_years,
        "required_years": required_years
    }