import { X } from 'lucide-react'
import { CandidateRadarChart } from './Charts'

function CandidateModal({ candidate, onClose, t }) {
  if (!candidate) return null

  const getScoreColor = (score) => {
    if (score >= 75) return '#16a34a'
    if (score >= 50) return '#d97706'
    return '#dc2626'
  }

  const confidenceLevelColor = (level) => {
    if (level === 'High') return '#16a34a'
    if (level === 'Medium') return '#a16207'
    if (level === 'Low') return '#c2410c'
    return '#dc2626'
  }

  const checkLabel = (key) => ({
    name_found: 'Name',
    email_found: 'Email',
    skills_extracted: 'Skills',
    experience_extracted: 'Experience',
    education_extracted: 'Education',
    experience_years: 'Years of Exp.',
    certifications: 'Certifications',
    location: 'Location',
    work_authorization: 'Work Authorization',
  }[key] ?? key)

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

        <CandidateRadarChart candidate={candidate} t={t} />

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

        {candidate.confidence && (
          <div style={{marginTop: 24}}>
            <h3 style={{fontSize: 15, marginBottom: 12}}>AI Extraction Confidence</h3>

            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
              <div style={{flex: 1, background: '#e5e7eb', borderRadius: 9999, height: 10, overflow: 'hidden'}}>
                <div style={{
                  width: `${candidate.confidence.score}%`,
                  height: '100%',
                  background: confidenceLevelColor(candidate.confidence.level),
                  borderRadius: 9999,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{fontWeight: 700, fontSize: 14, color: confidenceLevelColor(candidate.confidence.level), whiteSpace: 'nowrap'}}>
                {candidate.confidence.score}% — {candidate.confidence.level}
              </span>
            </div>

            {candidate.confidence.checks && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8}}>
                {Object.entries(candidate.confidence.checks).map(([key, check]) => (
                  <div key={key} style={{
                    background: check.score === check.max ? '#f0fdf4' : check.score > 0 ? '#fefce8' : '#fef2f2',
                    border: `1px solid ${check.score === check.max ? '#bbf7d0' : check.score > 0 ? '#fde68a' : '#fecaca'}`,
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}>
                    <div style={{fontSize: 12, color: '#64748b', marginBottom: 2}}>{checkLabel(key)}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontSize: 12, color: '#374151', flex: 1, marginRight: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                            title={check.detail}>
                        {check.detail}
                      </span>
                      <span style={{fontWeight: 700, fontSize: 13, color: check.score === check.max ? '#16a34a' : check.score > 0 ? '#d97706' : '#dc2626', whiteSpace: 'nowrap'}}>
                        {check.score}/{check.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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