from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from services.pdf_parser import parse_resume
from models.resume import create_resume_document
from config import get_collections
from utils.validators import validate_file
import os

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/api/upload', methods=['POST'])
def upload_resume():
    # Check if file was sent
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate the file
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    errors = validate_file(file.filename, file_size)
    if errors:
        return jsonify({'errors': errors}), 400

    # Save file to uploads folder
    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Parse the PDF
    raw_text = parse_resume(file_path)
    if not raw_text:
        return jsonify({'error': 'Could not extract text from PDF'}), 400

    # Store in MongoDB
    collections = get_collections()
    resume_doc = create_resume_document(filename, raw_text, file_path)
    result = collections['resumes'].insert_one(resume_doc)

    return jsonify({
        'message': 'Resume uploaded successfully',
        'id': str(result.inserted_id),
        'filename': filename,
        'text_preview': raw_text[:200]
    }), 201
from bson import ObjectId

@upload_bp.route('/api/resumes', methods=['GET'])
def get_resumes():
    collections = get_collections()
    resumes = list(collections['resumes'].find({}, {
        'raw_text': 0
    }).sort('uploaded_at', -1))

    for r in resumes:
        r['_id'] = str(r['_id'])

    return jsonify({'resumes': resumes, 'count': len(resumes)})
