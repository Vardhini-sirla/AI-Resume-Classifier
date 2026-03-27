from flask import Blueprint, jsonify
from config import get_collections
from bson import ObjectId
import os

delete_bp = Blueprint('delete', __name__)

@delete_bp.route('/api/resumes/<resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    try:
        collections = get_collections()
        resume = collections['resumes'].find_one({'_id': ObjectId(resume_id)})
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Delete file from uploads folder
        if resume.get('file_path') and os.path.exists(resume['file_path']):
            os.remove(resume['file_path'])
        
        # Delete from database
        collections['resumes'].delete_one({'_id': ObjectId(resume_id)})
        
        return jsonify({'message': f'{resume["filename"]} deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@delete_bp.route('/api/resumes/all', methods=['DELETE'])
def delete_all_resumes():
    try:
        collections = get_collections()
        resumes = list(collections['resumes'].find())
        
        # Delete all files
        for resume in resumes:
            if resume.get('file_path') and os.path.exists(resume['file_path']):
                os.remove(resume['file_path'])
        
        # Delete all from database
        result = collections['resumes'].delete_many({})
        
        return jsonify({'message': f'{result.deleted_count} resumes deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500