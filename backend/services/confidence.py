def calculate_confidence(parsed_data):
    """Calculate how confident we are in the AI extraction quality"""
    
    if not parsed_data:
        return {"score": 0, "level": "No Data", "details": {}}
    
    checks = {}
    
    # Name found (10 points)
    name = parsed_data.get("name", "")
    checks["name_found"] = {
        "score": 10 if name and len(name) > 2 else 0,
        "max": 10,
        "detail": name if name else "Not found"
    }
    
    # Email found (10 points)
    email = parsed_data.get("email", "")
    checks["email_found"] = {
        "score": 10 if email and "@" in email else 0,
        "max": 10,
        "detail": email if email else "Not found"
    }
    
    # Skills extracted (20 points)
    skills = parsed_data.get("skills", [])
    skill_count = len(skills)
    if skill_count >= 8:
        skill_score = 20
    elif skill_count >= 5:
        skill_score = 15
    elif skill_count >= 3:
        skill_score = 10
    elif skill_count >= 1:
        skill_score = 5
    else:
        skill_score = 0
    checks["skills_extracted"] = {
        "score": skill_score,
        "max": 20,
        "detail": f"{skill_count} skills found"
    }
    
    # Experience extracted (20 points)
    experience = parsed_data.get("experience", [])
    exp_count = len(experience)
    if exp_count >= 3:
        exp_score = 20
    elif exp_count >= 2:
        exp_score = 15
    elif exp_count >= 1:
        exp_score = 10
    else:
        exp_score = 0
    
    # Check if experience entries have all fields
    exp_quality = 0
    for exp in experience:
        if exp.get("title") and exp.get("company") and exp.get("duration"):
            exp_quality += 1
    if experience:
        quality_pct = exp_quality / len(experience)
        exp_score = int(exp_score * quality_pct)
    
    checks["experience_extracted"] = {
        "score": exp_score,
        "max": 20,
        "detail": f"{exp_count} positions found, {exp_quality} complete"
    }
    
    # Education extracted (15 points)
    education = parsed_data.get("education", [])
    edu_count = len(education)
    if edu_count >= 2:
        edu_score = 15
    elif edu_count >= 1:
        edu_score = 10
    else:
        edu_score = 0
    
    edu_quality = 0
    for edu in education:
        if edu.get("degree") and edu.get("institution"):
            edu_quality += 1
    if education:
        quality_pct = edu_quality / len(education)
        edu_score = int(edu_score * quality_pct)
    
    checks["education_extracted"] = {
        "score": edu_score,
        "max": 15,
        "detail": f"{edu_count} degrees found, {edu_quality} complete"
    }
    
    # Years of experience (10 points)
    years = parsed_data.get("total_years_experience", 0)
    checks["experience_years"] = {
        "score": 10 if years and years > 0 else 0,
        "max": 10,
        "detail": f"{years} years" if years else "Not determined"
    }
    
    # Certifications (5 points)
    certs = parsed_data.get("certifications", [])
    checks["certifications"] = {
        "score": 5 if certs and len(certs) > 0 else 2,
        "max": 5,
        "detail": f"{len(certs)} certifications" if certs else "None found (may not have any)"
    }
    
    # Location (5 points)
    location = parsed_data.get("location", "")
    checks["location"] = {
        "score": 5 if location and len(location) > 2 else 0,
        "max": 5,
        "detail": location if location else "Not found"
    }
    
    # Work authorization (5 points)
    auth = parsed_data.get("work_authorization", "unknown")
    checks["work_authorization"] = {
        "score": 5 if auth and auth != "unknown" else 2,
        "max": 5,
        "detail": auth if auth != "unknown" else "Not specified (common)"
    }
    
    # Calculate total
    total_score = sum(c["score"] for c in checks.values())
    max_score = sum(c["max"] for c in checks.values())
    confidence_pct = round((total_score / max_score) * 100, 1)
    
    # Determine level
    if confidence_pct >= 85:
        level = "High"
        color = "#16a34a"
    elif confidence_pct >= 65:
        level = "Medium"
        color = "#d97706"
    elif confidence_pct >= 40:
        level = "Low"
        color = "#f97316"
    else:
        level = "Very Low"
        color = "#dc2626"
    
    return {
        "score": confidence_pct,
        "level": level,
        "color": color,
        "total_points": total_score,
        "max_points": max_score,
        "checks": checks
    }