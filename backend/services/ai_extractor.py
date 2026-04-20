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
_RETRY_DELAY = 2  # seconds

SYSTEM_PROMPT = """You are an expert resume parser for an enterprise HR platform.
Your ONLY job is to extract structured information from resume text and return it as
valid JSON — no markdown fences, no commentary, no extra keys.

Rules:
- Extract ALL technical skills: programming languages, frameworks, libraries, tools,
  databases, cloud platforms, methodologies (Agile, Scrum), and domain knowledge.
- Normalise skill names to their common industry form (e.g. "JS" → "JavaScript",
  "Mongo" → "MongoDB", "K8s" → "Kubernetes").
- For total_years_experience: calculate from the sum of non-overlapping work periods.
  If dates are missing, estimate conservatively. Never exceed 50.
- For education: include degree, institution, and graduation year/range.
- For certifications: only include formal professional certifications (e.g. AWS Certified,
  PMP, CPA) — do NOT list academic degrees here.
- work_authorization values: "US Citizen", "Green Card", "H1B", "OPT", "CPT", "EAD",
  "Authorized to Work", or "unknown" if not mentioned.
- willing_to_relocate: true only if resume explicitly states willingness to relocate.
- veteran_status: true only if resume explicitly mentions military/armed-forces service.
- Return default values (empty list [], 0, false, "unknown") for missing fields —
  never omit a field.
"""

USER_TEMPLATE = """Parse the following resume and return ONLY the JSON object below.
Fill every field. Use empty strings / empty lists / 0 / false / "unknown" for missing data.

Required JSON structure:
{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or empty string",
  "location": "City, State/Country or empty string",
  "willing_to_relocate": false,
  "skills": ["skill1", "skill2"],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Dec 2022",
      "description": "Key responsibilities and achievements in 1-2 sentences"
    }}
  ],
  "education": [
    {{
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "year": "2018"
    }}
  ],
  "certifications": ["AWS Certified Solutions Architect", "PMP"],
  "total_years_experience": 5,
  "veteran_status": false,
  "work_authorization": "unknown",
  "availability": "unknown",
  "notice_period": "unknown"
}}

Resume text:
{resume_text}
"""

REQUIRED_FIELDS_DEFAULTS = {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "willing_to_relocate": False,
    "skills": [],
    "experience": [],
    "education": [],
    "certifications": [],
    "total_years_experience": 0,
    "veteran_status": False,
    "work_authorization": "unknown",
    "availability": "unknown",
    "notice_period": "unknown",
}


def _sanitize(parsed: dict) -> dict:
    """Ensure every required field is present with a valid default."""
    for field, default in REQUIRED_FIELDS_DEFAULTS.items():
        if field not in parsed or parsed[field] is None:
            logger.debug("Missing field '%s' — using default: %s", field, default)
            parsed[field] = default

    # Coerce types
    if not isinstance(parsed["skills"], list):
        parsed["skills"] = []
    if not isinstance(parsed["experience"], list):
        parsed["experience"] = []
    if not isinstance(parsed["education"], list):
        parsed["education"] = []
    if not isinstance(parsed["certifications"], list):
        parsed["certifications"] = []
    try:
        parsed["total_years_experience"] = float(parsed["total_years_experience"])
    except (TypeError, ValueError):
        parsed["total_years_experience"] = 0.0

    return parsed


def _strip_markdown(text: str) -> str:
    """Remove accidental markdown code fences from the model response."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop first line (``` or ```json) and last line (```)
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return text.strip()


def extract_resume_data(raw_text: str) -> dict | None:
    """
    Use OpenAI to extract structured resume data.
    Retries up to _MAX_RETRIES times on transient errors.
    Returns a validated dict, or None if extraction fails after all retries.
    """
    if not raw_text or len(raw_text.strip()) < 30:
        logger.warning("Resume text is too short to extract data from.")
        return None

    prompt = USER_TEMPLATE.format(resume_text=raw_text[:12000])  # token budget guard

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
                max_tokens=1500,
            )
            raw = response.choices[0].message.content
            cleaned = _strip_markdown(raw)
            parsed = json.loads(cleaned)
            return _sanitize(parsed)

        except json.JSONDecodeError as exc:
            logger.error("Attempt %d: JSON parse error in resume extraction: %s", attempt, exc)
            last_error = exc
            # Don't retry JSON errors — the model produced bad output; prompt is stable
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
            logger.exception("Attempt %d: Unexpected error during resume extraction: %s", attempt, exc)
            last_error = exc
            break

    logger.error("Resume extraction failed after %d attempts. Last error: %s", _MAX_RETRIES, last_error)
    return None
