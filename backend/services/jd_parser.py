import json
import logging
import os
import time

from dotenv import load_dotenv
from openai import OpenAI, RateLimitError, APIError

load_dotenv()

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
_MAX_RETRIES = 3
_RETRY_DELAY = 2

SYSTEM_PROMPT = """You are an expert job description analyst for an enterprise ATS (Applicant Tracking System).
Your ONLY job is to extract structured hiring requirements from a job description and return them as
valid JSON — no markdown fences, no commentary, no extra keys.

Rules:
- required_skills: ONLY domain-specific, observable, and measurable skills the role requires.
  For technical roles: programming languages, frameworks, databases, cloud platforms, tools.
  For non-technical roles: concrete job-specific skills only
    (e.g. cleaning → "floor cleaning", "sanitization", "waste disposal", "chemical handling";
     cooking → "food preparation", "knife skills", "food safety", "cooking techniques";
     driving → "commercial driving", "vehicle inspection", "route planning";
     nursing → "patient care", "IV administration", "medication management").
  STRICTLY EXCLUDE generic soft skills that apply to any job:
    DO NOT include: "attention to detail", "communication", "teamwork", "time management",
    "work independently", "problem solving", "organization", "multitasking",
    "interpersonal skills", "fast learner", "adaptability", "reliability", "punctuality".
  NEVER leave required_skills empty — extract at least 2-3 domain-specific skills.
  Normalise to common industry names (e.g. "Postgres" → "PostgreSQL", "K8s" → "Kubernetes").
- preferred_skills: skills marked as PREFERRED, NICE TO HAVE, BONUS, or PLUS.
  If unclear whether required or preferred, place in preferred_skills.
- required_experience_years: the MINIMUM years of experience required.
  - If given as a range (e.g. "3–5 years"), use the lower bound.
  - If given qualitatively: Entry/Junior = 1, Mid-level = 3, Senior = 5, Lead/Principal = 8, Staff/Director = 10.
  - If not mentioned, use 0.
- required_education: the MINIMUM degree level as one of:
  "High School", "Associate", "Bachelor's", "Master's", "PhD", or "" if not specified.
- key_responsibilities: up to 6 concise bullet-point summaries of the main job duties.
- job_title: the exact title as written in the posting.

Return ONLY the JSON object — no additional text.
"""

USER_TEMPLATE = """Analyse the following job description and return ONLY the JSON object below.

Required JSON structure:
{{
  "job_title": "Software Engineer",
  "required_skills": ["Python", "Django", "PostgreSQL", "AWS"],
  "preferred_skills": ["Redis", "Docker", "GraphQL"],
  "required_experience_years": 3,
  "required_education": "Bachelor's",
  "key_responsibilities": [
    "Design and build scalable backend services",
    "Collaborate with product and design teams"
  ]
}}

Job Description:
{jd_text}
"""

REQUIRED_FIELDS_DEFAULTS = {
    "job_title": "Unknown Position",
    "required_skills": [],
    "preferred_skills": [],
    "required_experience_years": 0,
    "required_education": "",
    "key_responsibilities": [],
}


def _sanitize(parsed: dict) -> dict:
    """Ensure every required field is present with a valid default."""
    for field, default in REQUIRED_FIELDS_DEFAULTS.items():
        if field not in parsed or parsed[field] is None:
            logger.debug("JD missing field '%s' — using default.", field)
            parsed[field] = default

    if not isinstance(parsed["required_skills"], list):
        parsed["required_skills"] = []
    if not isinstance(parsed["preferred_skills"], list):
        parsed["preferred_skills"] = []
    if not isinstance(parsed["key_responsibilities"], list):
        parsed["key_responsibilities"] = []

    try:
        parsed["required_experience_years"] = float(parsed["required_experience_years"])
    except (TypeError, ValueError):
        parsed["required_experience_years"] = 0.0

    return parsed


def _strip_markdown(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return text.strip()


def extract_jd_data(jd_text: str) -> dict | None:
    """
    Use OpenAI to extract structured requirements from a job description.
    Retries on transient errors. Returns a validated dict or None on failure.
    """
    if not jd_text or len(jd_text.strip()) < 20:
        logger.warning("Job description text is too short.")
        return None

    prompt = USER_TEMPLATE.format(jd_text=jd_text[:8000])  # token budget guard

    last_error = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=800,
            )
            raw = response.choices[0].message.content
            cleaned = _strip_markdown(raw)
            parsed = json.loads(cleaned)
            return _sanitize(parsed)

        except json.JSONDecodeError as exc:
            logger.error("Attempt %d: JSON parse error in JD extraction: %s", attempt, exc)
            last_error = exc
            break

        except RateLimitError as exc:
            logger.warning("Attempt %d: OpenAI rate limit hit: %s", attempt, exc)
            last_error = exc
            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY * attempt)

        except APIError as exc:
            logger.error("Attempt %d: OpenAI API error: %s", attempt, exc)
            last_error = exc
            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY)

        except Exception as exc:
            logger.exception("Attempt %d: Unexpected error during JD extraction: %s", attempt, exc)
            last_error = exc
            break

    logger.error("JD extraction failed after %d attempts. Last error: %s", _MAX_RETRIES, last_error)
    return None
