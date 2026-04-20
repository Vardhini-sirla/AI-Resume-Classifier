function ScoreResults({ results, onSelect, t }) {
  if (!results || results.length === 0) return null

  const getConfidenceStyle = (confidence) => {
    if (!confidence) return { background: '#e5e7eb', color: '#6b7280' }
    const level = confidence.level
    if (level === 'High') return { background: '#dcfce7', color: '#16a34a' }
    if (level === 'Medium') return { background: '#fef9c3', color: '#a16207' }
    if (level === 'Low') return { background: '#ffedd5', color: '#c2410c' }
    return { background: '#fee2e2', color: '#dc2626' }
  }

  const getScoreColor = (score) => {
    if (score >= 75) return '#16a34a'
    if (score >= 50) return '#d97706'
    return '#dc2626'
  }

  return (
    <table className='results-table'>
      <thead>
        <tr>
          <th>{t.rank}</th>
          <th>{t.candidate}</th>
          <th>{t.score}</th>
          <th>{t.skills}</th>
          <th>{t.experience}</th>
          <th>{t.education}</th>
          <th>Confidence</th>
          <th>{t.tier}</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr key={r.resume_id} onClick={() => onSelect(r)}>
            <td style={{fontWeight: 700, color: '#3b82f6'}}>{i + 1}</td>
            <td>{r.filename}</td>
            <td>
              <div className='score-bar'>
                <div className='score-bar-fill' style={{width: `${r.score}%`, background: getScoreColor(r.score)}} />
              </div>
              <strong>{r.score}</strong>
            </td>
            <td>{r.breakdown.skills_score}%</td>
            <td>{r.breakdown.experience_score}%</td>
            <td>{r.breakdown.education_score}%</td>
            <td>
              <span style={{
                ...getConfidenceStyle(r.confidence),
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                {r.confidence ? `${r.confidence.score}% ${r.confidence.level}` : 'N/A'}
              </span>
            </td>
            <td>
              <span className={`tier-badge ${r.tier.includes('Tier 1') ? 'tier-1' : r.tier.includes('Tier 2') ? 'tier-2' : 'tier-3'}`}>
                {r.tier.replace(' - Strong Match', '').replace(' - Potential Match', '').replace(' - Weak Match', '')}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ScoreResults