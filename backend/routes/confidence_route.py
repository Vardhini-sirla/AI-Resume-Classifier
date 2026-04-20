import logging

from bson import ObjectId
from flask import Blueprint, jsonify

from config import get_collections
from services.confidence import calculate_confidence

logger = logging.getLogger(__name__)

confidence_bp = Blueprint("confidence", __name__)


@confidence_bp.route("/api/confidence/<resume_id>", methods=["GET"])
def get_confidence(resume_id):
    collections = get_collections()

    try:
        resume = collections["resumes"].find_one({"_id": ObjectId(resume_id)})
    except Exception:
        return jsonify({"error": "Invalid resume ID"}), 400

    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    parsed_data = resume.get("parsed_data")
    if not parsed_data:
        return jsonify({"error": "Resume has not been processed yet"}), 409

    result = calculate_confidence(parsed_data)
    return jsonify({"resume_id": resume_id, "filename": resume.get("filename", ""), **result})
