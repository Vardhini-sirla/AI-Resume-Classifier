import { X } from 'lucide-react'

function CandidateModal({ candidate, onClose, t }) {
  if (!candidate) return null

  const getScoreColor = (score) => {
    if (score >= 75) return '#16a34a'
    if (score >= 50) return '#d97706'
    return '#dc2626'
  }

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>{candidate.filename}</h2>
          <button className='modal-close' onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{textAlign: 'center', marginBottom: 20}}>
          <div style={{fontSize: 48, fontWeight: 700, color: getScoreColor(candidate.score)}}>
            {candidate.score}
          </div>
          <span className={`tier-badge ${candidate.tier.includes('Tier 1') ? 'tier-1' : candidate.tier.includes('Tier 2') ? 'tier-2' : 'tier-3'}`}>
            {candidate.tier}
          </span>
        </div>

        <div className='breakdown-grid'>
          <div className='breakdown-card' style={{background: '#f0fdf4'}}>
            <div className='score-label'>{t.skills}</div>
            <div className='score-value' style={{color: '#16a34a'}}>{candidate.breakdown.skills_score}%</div>
            <div className='score-weight'>50% {t.weight}</div>
          </div>
          <div className='breakdown-card' style={{background: '#fefce8'}}>
            <div className='score-label'>{t.experience}</div>
            <div className='score-value' style={{color: '#d97706'}}>{candidate.breakdown.experience_score}%</div>
            <div className='score-weight'>30% {t.weight}</div>
          </div>
          <div className='breakdown-card' style={{background: '#eff6ff'}}>
            <div className='score-label'>{t.education}</div>
            <div className='score-value' style={{color: '#3b82f6'}}>{candidate.breakdown.education_score}%</div>
            <div className='score-weight'>20% {t.weight}</div>
          </div>
        </div>

        {candidate.details && (
          <div style={{marginTop: 20}}>
            <h3 style={{fontSize: 15, marginBottom: 8}}>{t.skillsMatch}</h3>
            <div>
              {candidate.details.skills?.required_matched?.map(s => (
                <span key={s} className='skill-tag skill-matched'>{s}</span>
              ))}
              {candidate.details.skills?.required_missing?.map(s => (
                <span key={s} className='skill-tag skill-missing'>{s}</span>
              ))}
            </div>
            <p style={{fontSize: 12, color: '#64748b', marginTop: 8}}>
              🟢 = {t.matched}, 🔴 = {t.missing}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CandidateModal