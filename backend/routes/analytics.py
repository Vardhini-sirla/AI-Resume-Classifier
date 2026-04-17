from flask import Blueprint, jsonify
from config import get_collections

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics', methods=['GET'])
def get_analytics():
    collections = get_collections()
    resumes = list(collections['resumes'].find({'status': 'scored'}))
    
    if not resumes:
        return jsonify({'error': 'No scored resumes found'}), 404
    
    total = len(resumes)
    
    # Veteran stats
    veterans = sum(1 for r in resumes if r.get('parsed_data', {}).get('veteran_status', False))
    non_veterans = total - veterans
    
    # Work authorization stats
    auth_stats = {}
    for r in resumes:
        auth = r.get('parsed_data', {}).get('work_authorization', 'unknown')
        auth_stats[auth] = auth_stats.get(auth, 0) + 1
    
    # Location stats
    location_stats = {}
    for r in resumes:
        loc = r.get('parsed_data', {}).get('location', 'Unknown')
        if not loc:
            loc = 'Unknown'
        location_stats[loc] = location_stats.get(loc, 0) + 1
    
    # Relocation willingness
    willing_relocate = sum(1 for r in resumes if r.get('parsed_data', {}).get('willing_to_relocate', False))
    not_willing = total - willing_relocate
    
    # Availability stats
    avail_stats = {}
    for r in resumes:
        avail = r.get('parsed_data', {}).get('availability', 'unknown')
        avail_stats[avail] = avail_stats.get(avail, 0) + 1
    
    # Certification stats
    cert_count = {}
    has_certs = 0
    no_certs = 0
    for r in resumes:
        certs = r.get('parsed_data', {}).get('certifications', [])
        if certs and len(certs) > 0:
            has_certs += 1
            for cert in certs:
                cert_count[cert] = cert_count.get(cert, 0) + 1
        else:
            no_certs += 1
    
    # Top skills across all resumes
    skill_count = {}
    for r in resumes:
        skills = r.get('parsed_data', {}).get('skills', [])
        for skill in skills:
            skill_count[skill.lower()] = skill_count.get(skill.lower(), 0) + 1
    top_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:15]
    
    # Experience distribution
    exp_ranges = {'0-1 years': 0, '1-3 years': 0, '3-5 years': 0, '5-10 years': 0, '10+ years': 0}
    for r in resumes:
        years = r.get('parsed_data', {}).get('total_years_experience', 0)
        if years <= 1:
            exp_ranges['0-1 years'] += 1
        elif years <= 3:
            exp_ranges['1-3 years'] += 1
        elif years <= 5:
            exp_ranges['3-5 years'] += 1
        elif years <= 10:
            exp_ranges['5-10 years'] += 1
        else:
            exp_ranges['10+ years'] += 1
    
    # Tier distribution
    tier_stats = {'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0}
    for r in resumes:
        tier = r.get('tier', '')
        if 'Tier 1' in tier:
            tier_stats['Tier 1'] += 1
        elif 'Tier 2' in tier:
            tier_stats['Tier 2'] += 1
        elif 'Tier 3' in tier:
            tier_stats['Tier 3'] += 1
    
    # Education level distribution
    edu_levels = {'High School': 0, 'Associate': 0, 'Bachelor': 0, 'Master': 0, 'PhD/Doctorate': 0, 'Other': 0}
    for r in resumes:
        education = r.get('parsed_data', {}).get('education', [])
        highest = 'Other'
        for edu in education:
            degree = edu.get('degree', '').lower()
            if 'phd' in degree or 'doctor' in degree:
                highest = 'PhD/Doctorate'
            elif 'master' in degree:
                if highest not in ['PhD/Doctorate']:
                    highest = 'Master'
            elif 'bachelor' in degree:
                if highest not in ['PhD/Doctorate', 'Master']:
                    highest = 'Bachelor'
            elif 'associate' in degree:
                if highest not in ['PhD/Doctorate', 'Master', 'Bachelor']:
                    highest = 'Associate'
        edu_levels[highest] += 1
    
    return jsonify({
        'total_candidates': total,
        'veteran': {
            'veterans': veterans,
            'non_veterans': non_veterans
        },
        'work_authorization': auth_stats,
        'location': location_stats,
        'relocation': {
            'willing': willing_relocate,
            'not_willing': not_willing
        },
        'availability': avail_stats,
        'certifications': {
            'has_certifications': has_certs,
            'no_certifications': no_certs,
            'top_certifications': dict(sorted(cert_count.items(), key=lambda x: x[1], reverse=True)[:10])
        },
        'top_skills': [{'skill': s[0], 'count': s[1]} for s in top_skills],
        'experience_distribution': exp_ranges,
        'tier_distribution': tier_stats,
        'education_levels': edu_levels
    })