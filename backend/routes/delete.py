import logging
import os

from bson import ObjectId
from flask import Blueprint, jsonify

from config import get_collections

logger = logging.getLogger(__name__)

delete_bp = Blueprint("delete", __name__)


# NOTE: The static route /api/resumes/all MUST be declared before the dynamic
# /api/resumes/<resume_id> so Flask (Werkzeug) always matches the literal "all"
# path instead of treating it as a resume_id.
@delete_bp.route("/api/resumes/all", methods=["DELETE"])
def delete_all_resumes():
    try:
        collections = get_collections()
        resumes = list(collections["resumes"].find({}, {"file_path": 1}))

        deleted_files = 0
        for resume in resumes:
            fp = resume.get("file_path")
            if fp and os.path.exists(fp):
                os.remove(fp)
                deleted_files += 1

        result = collections["resumes"].delete_many({})
        logger.info("Deleted all resumes: %d records, %d files", result.deleted_count, deleted_files)
        return jsonify({"message": f"{result.deleted_count} resumes deleted"})

    except Exception as exc:
        logger.exception("Error deleting all resumes: %s", exc)
        return jsonify({"error": str(exc)}), 500


@delete_bp.route("/api/resumes/<resume_id>", methods=["DELETE"])
def delete_resume(resume_id: str):
    try:
        collections = get_collections()
        resume = collections["resumes"].find_one({"_id": ObjectId(resume_id)})

        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        fp = resume.get("file_path")
        if fp and os.path.exists(fp):
            os.remove(fp)

        collections["resumes"].delete_one({"_id": ObjectId(resume_id)})
        logger.info("Deleted resume: %s (%s)", resume.get("filename"), resume_id)
        return jsonify({"message": f"{resume['filename']} deleted successfully"})

    except Exception as exc:
        logger.exception("Error deleting resume %s: %s", resume_id, exc)
        return jsonify({"error": str(exc)}), 500
