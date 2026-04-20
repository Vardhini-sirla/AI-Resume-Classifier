import logging
from services.matcher import match_skills, match_education, match_experience

logger = logging.getLogger(__name__)

DEFAULT_WEIGHTS = {"skills": 60, "experience": 25, "education": 15}


def _validate_weights(weights: dict) -> dict:
    """
    Ensure weights are valid positive numbers that sum to 100.
    Returns safe weights, falling back to defaults on bad input.
    """
    try:
        s = weights.get("skills", 0)
        e = weights.get("experience", 0)
        d = weights.get("education", 0)
        if not all(isinstance(v, (int, float)) and v >= 0 for v in [s, e, d]):
            raise ValueError("Weights must be non-negative numbers")
        total = s + e + d
        if total == 0:
            raise ValueError("Weights must not all be zero")
        # Normalize so they sum to exactly 100
        return {
            "skills": round(s / total * 100, 4),
            "experience": round(e / total * 100, 4),
            "education": round(d / total * 100, 4),
        }
    except Exception as exc:
        logger.warning("Invalid weights provided (%s), using defaults: %s", exc, DEFAULT_WEIGHTS)
        return dict(DEFAULT_WEIGHTS)


def calculate_score(resume_data: dict, jd_data: dict, weights: dict = None) -> dict:
    """
    Calculate a weighted score for a resume against a job description.

    Weights:
        skills      (default 50%) – how well the candidate's skills match
        experience  (default 30%) – years of experience vs. requirement
        education   (default 20%) – highest degree vs. requirement

    Within the skills component:
        required skills  → 80 % of skills score
        preferred skills → 20 % of skills score
    """
    w = _validate_weights(weights or DEFAULT_WEIGHTS)
    w_skills = w["skills"] / 100
    w_exp = w["experience"] / 100
    w_edu = w["education"] / 100

    # ── Skills (weighted component) ──────────────────────────────────────────
    skills_result = match_skills(
        resume_data.get("skills", []),
        jd_data.get("required_skills", []),
        jd_data.get("preferred_skills", []),
    )
    req_pct = skills_result["required_match_percentage"]
    pref_pct = skills_result["preferred_match_percentage"]
    # Required skills: 80% of skills score; preferred: 20%
    skills_score = (req_pct * 0.8) + (pref_pct * 0.2)

    # ── Experience ────────────────────────────────────────────────────────────
    resume_years = float(resume_data.get("total_years_experience") or 0)
    required_years = float(jd_data.get("required_experience_years") or 0)

    exp_result = match_experience(resume_years, required_years)

    if required_years == 0:
        experience_score = 100.0
    elif resume_years >= required_years:
        experience_score = 100.0
    elif resume_years > 0:
        # Linear interpolation, capped at 100
        experience_score = min((resume_years / required_years) * 100, 100.0)
    else:
        experience_score = 0.0

    # ── Education ─────────────────────────────────────────────────────────────
    edu_result = match_education(
        resume_data.get("education", []),
        jd_data.get("required_education", ""),
    )

    if edu_result["meets_requirement"]:
        education_score = 100.0
    elif edu_result["resume_level"] > 0 and edu_result["required_level"] > 0:
        education_score = min(
            (edu_result["resume_level"] / edu_result["required_level"]) * 100,
            100.0,
        )
    else:
        education_score = 0.0

    # ── Composite score ───────────────────────────────────────────────────────
    total_score = round(
        (skills_score * w_skills)
        + (experience_score * w_exp)
        + (education_score * w_edu),
        1,
    )

    # ── Zero-skills gate ──────────────────────────────────────────────────────
    # If the candidate matches NONE of the required skills, cap at 30 so they
    # always land in Tier 3 regardless of experience / education scores.
    required_skills_exist = bool(jd_data.get("required_skills"))
    if required_skills_exist and skills_result["required_match_percentage"] == 0:
        total_score = min(total_score, 30.0)

    # ── Tier classification ───────────────────────────────────────────────────
    if total_score >= 75:
        tier = "Tier 1 - Strong Match"
    elif total_score >= 50:
        tier = "Tier 2 - Potential Match"
    else:
        tier = "Tier 3 - Weak Match"

    weights_label = (
        f"Skills {round(w_skills * 100)}% | "
        f"Experience {round(w_exp * 100)}% | "
        f"Education {round(w_edu * 100)}%"
    )

    return {
        "total_score": total_score,
        "tier": tier,
        "breakdown": {
            "skills_score": round(skills_score, 1),
            "experience_score": round(experience_score, 1),
            "education_score": round(education_score, 1),
            "weights": weights_label,
        },
        "details": {
            "skills": skills_result,
            "experience": exp_result,
            "education": edu_result,
        },
    }
