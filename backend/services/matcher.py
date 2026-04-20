import re
import logging

logger = logging.getLogger(__name__)

# Canonical aliases: maps common variations → canonical form
# Both directions handled so either side can match
SKILL_ALIASES = {
    # JavaScript ecosystem
    "js": "javascript",
    "ecmascript": "javascript",
    "es6": "javascript",
    "es2015": "javascript",
    "reactjs": "react",
    "react js": "react",
    "react.js": "react",
    "vuejs": "vue",
    "vue js": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "angular js": "angular",
    "nextjs": "next.js",
    "next js": "next.js",
    "nuxtjs": "nuxt.js",
    "nuxt js": "nuxt.js",
    # TypeScript
    "ts": "typescript",
    # Node.js
    "node js": "node.js",
    "nodejs": "node.js",
    "node": "node.js",
    # C++ / C# / .NET
    "cpp": "c++",
    "c plus plus": "c++",
    "csharp": "c#",
    "c sharp": "c#",
    "dotnet": ".net",
    "dot net": ".net",
    "asp.net": ".net",
    "asp net": ".net",
    # Databases
    "postgres": "postgresql",
    "mongo": "mongodb",
    "mssql": "sql server",
    "microsoft sql server": "sql server",
    "mysql": "mysql",
    # Cloud
    "amazon web services": "aws",
    "google cloud platform": "gcp",
    "google cloud": "gcp",
    "azure cloud": "azure",
    "microsoft azure": "azure",
    # DevOps
    "k8s": "kubernetes",
    "docker container": "docker",
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    "continuous integration": "ci/cd",
    "continuous deployment": "ci/cd",
    # AI/ML
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "ai": "artificial intelligence",
    # API
    "rest": "rest api",
    "restful": "rest api",
    "restful api": "rest api",
    "graphql api": "graphql",
    # Version control
    "git hub": "github",
    "git lab": "gitlab",
}


def normalize_skill(skill: str) -> str:
    """Normalize skill names: lowercase, collapse separators to spaces."""
    skill = skill.lower().strip()
    # Replace separators (hyphen, underscore, slash) with space
    skill = re.sub(r'[-_/]', ' ', skill)
    # Collapse multiple spaces
    skill = re.sub(r'\s+', ' ', skill).strip()
    return skill


def get_canonical(skill: str) -> str:
    """Return the canonical/standard form of a skill."""
    return SKILL_ALIASES.get(skill, skill)


def skill_matches(req_skill: str, resume_skill: str) -> bool:
    """
    Determine if a required skill matches a resume skill.
    Uses word-boundary logic to avoid false positives like:
      - "java" matching "javascript"
      - "c" matching "c#" or "c++"
      - "r" matching "react"
    """
    # 1. Exact match
    if req_skill == resume_skill:
        return True

    # 2. Alias-based canonical match
    canonical_req = get_canonical(req_skill)
    canonical_res = get_canonical(resume_skill)
    if canonical_req == canonical_res:
        return True
    # Cross-alias: one normalized to the other
    if canonical_req == resume_skill or req_skill == canonical_res:
        return True

    req_words = req_skill.split()
    res_words = resume_skill.split()

    # 3. Multi-word required skill: ALL words must appear in resume skill words
    #    e.g. "machine learning" matches "applied machine learning"
    if len(req_words) > 1:
        if all(w in res_words for w in req_words):
            return True

    # 4. Single-word required skill: must appear as an EXACT token in a
    #    multi-word resume skill.
    #    "python" matches "python 3" → ["python","3"], "python" in list → True
    #    "java"   does NOT match "javascript" → ["javascript"], "java" not in list
    #    "c"      does NOT match "c#" → ["c#"], "c" not in list (# not stripped)
    if len(req_words) == 1 and len(res_words) > 1:
        if req_skill in res_words:
            return True

    # 5. Reverse: resume has single keyword that is the core of a multi-word req
    #    e.g. required "react js" but resume just lists "react"
    if len(res_words) == 1 and len(req_words) > 1:
        if resume_skill in req_words:
            return True

    return False


def match_skills(resume_skills, required_skills, preferred_skills=None):
    """Compare resume skills against job requirements."""

    resume_normalized = [normalize_skill(s) for s in resume_skills]
    required_normalized = [normalize_skill(s) for s in required_skills]
    preferred_normalized = [normalize_skill(s) for s in (preferred_skills or [])]

    # Required skills
    required_matched = []
    required_missing = []
    for skill in required_normalized:
        found = any(skill_matches(skill, r) for r in resume_normalized)
        if found:
            required_matched.append(skill)
        else:
            required_missing.append(skill)

    # Preferred skills
    preferred_matched = []
    for skill in preferred_normalized:
        if any(skill_matches(skill, r) for r in resume_normalized):
            preferred_matched.append(skill)

    # If the JD specified no required skills we cannot evaluate skill fit,
    # so we award 0 rather than a free 100 — prevents irrelevant resumes
    # from scoring high on jobs with vague / non-technical descriptions.
    required_match_pct = (
        len(required_matched) / len(required_normalized) * 100
        if required_normalized else 0.0
    )
    preferred_match_pct = (
        len(preferred_matched) / len(preferred_normalized) * 100
        if preferred_normalized else 0.0
    )

    return {
        "required_matched": required_matched,
        "required_missing": required_missing,
        "preferred_matched": preferred_matched,
        "required_match_percentage": round(required_match_pct, 1),
        "preferred_match_percentage": round(preferred_match_pct, 1),
    }


# Education level map — higher number = higher degree
EDU_LEVELS = {
    "high school": 1,
    "ged": 1,
    "diploma": 1,
    "associate": 2,
    "a.s": 2,
    "a.a": 2,
    "bachelor": 3,
    "b.s": 3,
    "b.a": 3,
    "b.e": 3,
    "b.tech": 3,
    "b.sc": 3,
    "undergraduate": 3,
    "master": 4,
    "m.s": 4,
    "m.a": 4,
    "m.e": 4,
    "m.tech": 4,
    "m.sc": 4,
    "mba": 4,
    "pgdm": 4,
    "postgraduate": 4,
    "phd": 5,
    "ph.d": 5,
    "doctorate": 5,
    "doctoral": 5,
    "d.sc": 5,
}


def _degree_level(degree_str: str) -> int:
    """Return the numeric level for a degree string, 0 if unrecognised."""
    lower = degree_str.lower()
    best = 0
    for keyword, level in EDU_LEVELS.items():
        if keyword in lower:
            best = max(best, level)
    return best


def match_education(resume_education, required_education: str):
    """Check whether the candidate's education meets the job requirement."""
    resume_level = 0
    for edu in resume_education:
        degree = edu.get("degree", "")
        lvl = _degree_level(degree)
        resume_level = max(resume_level, lvl)

    required_level = _degree_level(required_education)

    meets_requirement = (required_level == 0) or (resume_level >= required_level)

    return {
        "meets_requirement": meets_requirement,
        "resume_level": resume_level,
        "required_level": required_level,
    }


def match_experience(resume_years: float, required_years: float):
    """Check whether the candidate's experience meets the requirement."""
    meets_requirement = resume_years >= required_years
    return {
        "meets_requirement": meets_requirement,
        "resume_years": resume_years,
        "required_years": required_years,
    }
