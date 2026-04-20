import logging

from bson import ObjectId
from flask import Blueprint, jsonify, request

from config import get_collections
from services.ai_extractor import extract_resume_data
from services.confidence import calculate_confidence
from services.jd_parser import extract_jd_data
from services.scorer import DEFAULT_WEIGHTS, calculate_score

logger = logging.getLogger(__name__)

score_bp = Blueprint("score", __name__)


def _parse_weights(data: dict) -> dict:
    """
    Extract and lightly validate scoring weights from the request payload.
    Returns DEFAULT_WEIGHTS if nothing was provided or values are invalid.
    """
    raw = data.get("weights")
    if not isinstance(raw, dict):
        return dict(DEFAULT_WEIGHTS)
    try:
        weights = {
            "skills": float(raw.get("skills", DEFAULT_WEIGHTS["skills"])),
            "experience": float(raw.get("experience", DEFAULT_WEIGHTS["experience"])),
            "education": float(raw.get("education", DEFAULT_WEIGHTS["education"])),
        }
        if any(v < 0 for v in weights.values()):
            raise ValueError("Negative weight")
        if sum(weights.values()) == 0:
            raise ValueError("All-zero weights")
        return weights
    except Exception as exc:
        logger.warning("Bad weights in request (%s) — using defaults", exc)
        return dict(DEFAULT_WEIGHTS)


@score_bp.route("/api/score", methods=["POST"])
def score_resume():
    """Score a single resume against a job description."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    resume_id = data.get("resume_id")
    jd_text = data.get("jd_text")

    if not resume_id or not jd_text:
        return jsonify({"error": "resume_id and jd_text are required"}), 400

    collections = get_collections()

    try:
        resume = collections["resumes"].find_one({"_id": ObjectId(resume_id)})
    except Exception:
        return jsonify({"error": "Invalid resume ID"}), 400

    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    # Use cached parsed_data when available and complete
    parsed_data = resume.get("parsed_data")
    if parsed_data and parsed_data.get("name"):
        resume_data = parsed_data
    else:
        resume_data = extract_resume_data(resume["raw_text"])
    if not resume_data:
        return jsonify({"error": "Failed to extract resume data"}), 500

    jd_data = extract_jd_data(jd_text)
    if not jd_data:
        return jsonify({"error": "Failed to parse job description"}), 500

    if not jd_data.get("required_skills"):
        return jsonify({
            "error": "Job description is too vague to score against. "
                     "Please include specific required skills, tools, or qualifications."
        }), 400

    weights = _parse_weights(data)
    result = calculate_score(resume_data, jd_data, weights)
    confidence = calculate_confidence(resume_data)

    collections["resumes"].update_one(
        {"_id": ObjectId(resume_id)},
        {
            "$set": {
                "parsed_data": resume_data,
                "score": result["total_score"],
                "tier": result["tier"],
                "status": "scored",
            }
        },
    )

    logger.info("Scored resume %s → %.1f (%s)", resume_id, result["total_score"], result["tier"])

    return jsonify(
        {
            "resume_id": resume_id,
            "filename": resume["filename"],
            "score": result["total_score"],
            "tier": result["tier"],
            "breakdown": result["breakdown"],
            "details": result["details"],
            "parsed_resume": resume_data,
            "parsed_jd": jd_data,
            "confidence": confidence,
        }
    )


@score_bp.route("/api/score-all", methods=["POST"])
def score_all_resumes():
    """Score all uploaded resumes against a job description."""
    data = request.get_json()

    if not data or not data.get("jd_text"):
        return jsonify({"error": "jd_text is required"}), 400

    jd_text = data["jd_text"]
    weights = _parse_weights(data)

    collections = get_collections()

    jd_data = extract_jd_data(jd_text)
    if not jd_data:
        return jsonify({"error": "Failed to parse job description"}), 500

    if not jd_data.get("required_skills"):
        return jsonify({
            "error": "Job description is too vague to score against. "
                     "Please include specific required skills, tools, or qualifications "
                     "(e.g. 'Python, 3+ years experience, Bachelor's degree')."
        }), 400

    resumes = list(collections["resumes"].find())
    if not resumes:
        return jsonify({"error": "No resumes found. Please upload resumes first."}), 404

    # Block scoring if any resumes are still being extracted
    still_extracting = [r for r in resumes if r.get("status") == "extracting"]
    if still_extracting:
        return jsonify({
            "error": f"{len(still_extracting)} resume(s) are still being processed by AI. "
                     f"Please wait a moment and try again."
        }), 409

    results = []
    errors = []

    for resume in resumes:
        resume_id = str(resume["_id"])
        try:
            parsed_data = resume.get("parsed_data")
            if parsed_data and parsed_data.get("name"):
                resume_data = parsed_data
            else:
                resume_data = extract_resume_data(resume["raw_text"])
                if not resume_data:
                    errors.append({"resume_id": resume_id, "filename": resume["filename"], "error": "Extraction failed"})
                    continue

            result = calculate_score(resume_data, jd_data, weights)
            confidence = calculate_confidence(resume_data)

            collections["resumes"].update_one(
                {"_id": resume["_id"]},
                {
                    "$set": {
                        "parsed_data": resume_data,
                        "score": result["total_score"],
                        "tier": result["tier"],
                        "status": "scored",
                    }
                },
            )

            results.append(
                {
                    "resume_id": resume_id,
                    "filename": resume["filename"],
                    "score": result["total_score"],
                    "tier": result["tier"],
                    "breakdown": result["breakdown"],
                    "confidence": confidence,
                }
            )

        except Exception as exc:
            logger.exception("Error scoring resume %s: %s", resume_id, exc)
            errors.append({"resume_id": resume_id, "filename": resume.get("filename", "?"), "error": str(exc)})

    results.sort(key=lambda x: x["score"], reverse=True)

    logger.info(
        "score-all complete: %d scored, %d errors. Weights: %s",
        len(results), len(errors), weights,
    )

    return jsonify(
        {
            "job_description": jd_data,
            "results": results,
            "total_scored": len(results),
            "errors": errors,
            "weights_used": weights,
        }
    )
