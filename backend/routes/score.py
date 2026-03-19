from flask import Blueprint, request, jsonify
from services.ai_extractor import extract_resume_data
from services.jd_parser import extract_jd_data
from services.scorer import calculate_score
from config import get_collections
from bson import ObjectId

score_bp = Blueprint('score', __name__)

@score_bp.route('/api/score', methods=['POST'])
def score_resume():
    """Score a single resume against a job description"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    resume_id = data.get('resume_id')
    jd_text = data.get('jd_text')
    
    if not resume_id or not jd_text:
        return jsonify({'error': 'resume_id and jd_text are required'}), 400
    
    collections = get_collections()
    
    # Get resume from database
    try:
        resume = collections['resumes'].find_one({'_id': ObjectId(resume_id)})
    except:
        return jsonify({'error': 'Invalid resume ID'}), 400
    
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    
    # Extract resume data with AI
    resume_data = extract_resume_data(resume['raw_text'])
    if not resume_data:
        return jsonify({'error': 'Failed to extract resume data'}), 500
    
    # Extract job description requirements
    jd_data = extract_jd_data(jd_text)
    if not jd_data:
        return jsonify({'error': 'Failed to parse job description'}), 500
    
    # Calculate score
    result = calculate_score(resume_data, jd_data)
    
    # Update resume in database
    collections['resumes'].update_one(
        {'_id': ObjectId(resume_id)},
        {'$set': {
            'parsed_data': resume_data,
            'score': result['total_score'],
            'tier': result['tier'],
            'status': 'scored'
        }}
    )
    
    return jsonify({
        'resume_id': resume_id,
        'filename': resume['filename'],
        'score': result['total_score'],
        'tier': result['tier'],
        'breakdown': result['breakdown'],
        'details': result['details'],
        'parsed_resume': resume_data,
        'parsed_jd': jd_data
    })

@score_bp.route('/api/score-all', methods=['POST'])
def score_all_resumes():
    """Score all uploaded resumes against a job description"""
    data = request.get_json()
    
    if not data or not data.get('jd_text'):
        return jsonify({'error': 'jd_text is required'}), 400
    
    jd_text = data['jd_text']
    collections = get_collections()
    
    # Parse job description once
    jd_data = extract_jd_data(jd_text)
    if not jd_data:
        return jsonify({'error': 'Failed to parse job description'}), 500
    
    # Get all resumes
    resumes = list(collections['resumes'].find())
    results = []
    
    for resume in resumes:
        # Extract resume data
        resume_data = extract_resume_data(resume['raw_text'])
        if not resume_data:
            continue
        
        # Calculate score
        result = calculate_score(resume_data, jd_data)
        
        # Update in database
        collections['resumes'].update_one(
            {'_id': resume['_id']},
            {'$set': {
                'parsed_data': resume_data,
                'score': result['total_score'],
                'tier': result['tier'],
                'status': 'scored'
            }}
        )
        
        results.append({
            'resume_id': str(resume['_id']),
            'filename': resume['filename'],
            'score': result['total_score'],
            'tier': result['tier'],
            'breakdown': result['breakdown']
        })
    
    # Sort by score (highest first)
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({
        'job_description': jd_data,
        'results': results,
        'total_scored': len(results)
    })