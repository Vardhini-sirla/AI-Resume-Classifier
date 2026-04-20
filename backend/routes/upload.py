import logging
import os
import uuid
from concurrent.futures import ThreadPoolExecutor

from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

from config import get_collections
from models.resume import create_resume_document
from services.ai_extractor import extract_resume_data
from services.pdf_parser import parse_resume
from utils.validators import validate_file

logger = logging.getLogger(__name__)

upload_bp = Blueprint("upload", __name__)

# Max 3 concurrent OpenAI extraction calls to stay within rate limits
_extraction_pool = ThreadPoolExecutor(max_workers=3, thread_name_prefix="extractor")


def _extract_in_background(resume_id: str, raw_text: str) -> None:
    """Background task: extract structured data from resume text and update MongoDB."""
    collections = get_collections()
    try:
        collections["resumes"].update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {"status": "extracting"}}
        )

        parsed_data = extract_resume_data(raw_text)

        if parsed_data:
            collections["resumes"].update_one(
                {"_id": ObjectId(resume_id)},
                {"$set": {"parsed_data": parsed_data, "status": "extracted"}}
            )
            logger.info("Extraction complete for resume %s (%s)", resume_id, parsed_data.get("name", "?"))
        else:
            collections["resumes"].update_one(
                {"_id": ObjectId(resume_id)},
                {"$set": {"status": "extraction_failed"}}
            )
            logger.error("Extraction failed for resume %s", resume_id)

    except Exception as exc:
        logger.exception("Background extraction crashed for resume %s: %s", resume_id, exc)
        try:
            get_collections()["resumes"].update_one(
                {"_id": ObjectId(resume_id)},
                {"$set": {"status": "extraction_failed"}}
            )
        except Exception:
            pass


@upload_bp.route("/api/upload", methods=["POST"])
def upload_resume():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)

    errors = validate_file(file.filename, file_size)
    if errors:
        return jsonify({"errors": errors}), 400

    safe_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_name)
    file.save(file_path)

    raw_text = parse_resume(file_path)
    if not raw_text:
        os.remove(file_path)
        return jsonify({"error": "Could not extract text from the uploaded file. Ensure it is a readable PDF or DOCX."}), 400

    collections = get_collections()
    resume_doc = create_resume_document(file.filename, raw_text, file_path)
    result = collections["resumes"].insert_one(resume_doc)
    resume_id = str(result.inserted_id)

    # Kick off AI extraction in background immediately
    _extraction_pool.submit(_extract_in_background, resume_id, raw_text)

    logger.info("Uploaded and queued extraction: %s → id=%s", file.filename, resume_id)

    return jsonify({
        "message": "Resume uploaded. AI extraction started in background.",
        "id": resume_id,
        "filename": file.filename,
        "status": "extracting",
    }), 201


@upload_bp.route("/api/resumes", methods=["GET"])
def get_resumes():
    collections = get_collections()
    resumes = list(
        collections["resumes"].find({}, {"raw_text": 0}).sort("uploaded_at", -1)
    )
    for r in resumes:
        r["_id"] = str(r["_id"])
    return jsonify({"resumes": resumes, "count": len(resumes)})


@upload_bp.route("/api/resumes/status", methods=["GET"])
def get_extraction_status():
    """Returns a summary of how many resumes are in each extraction state."""
    collections = get_collections()
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    counts = {doc["_id"]: doc["count"] for doc in collections["resumes"].aggregate(pipeline)}
    extracting = counts.get("extracting", 0)
    return jsonify({
        "counts": counts,
        "all_ready": extracting == 0,
        "extracting": extracting,
    })
