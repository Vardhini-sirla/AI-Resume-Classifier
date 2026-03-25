function ScoreResults({ results }) {
  if (!results || results.length === 0) return null

  const getTierColor = (tier) => {
    if (tier.includes('Tier 1')) return '#16a34a'
    if (tier.includes('Tier 2')) return '#d97706'
    return '#dc2626'
  }

  return (
    <div className='results-section'>
      <h2>Scoring Results</h2>
      {results.map((r, i) => (
        <div key={r.resume_id} className='result-card'>
          <div className='result-header'>
            <span className='rank'>#{i + 1}</span>
            <strong>{r.filename}</strong>
            <span className='score'>{r.score}/100</span>
            <span className='tier' style={{ color: getTierColor(r.tier) }}>
              {r.tier}
            </span>
          </div>
          <div className='breakdown'>
            <span>Skills: {r.breakdown.skills_score}%</span>
            <span>Experience: {r.breakdown.experience_score}%</span>
            <span>Education: {r.breakdown.education_score}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ScoreResults