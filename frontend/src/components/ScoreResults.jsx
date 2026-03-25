function ScoreResults({ results, onSelect }) {
  if (!results || results.length === 0) return null

  const getScoreColor = (score) => {
    if (score >= 75) return '#16a34a'
    if (score >= 50) return '#d97706'
    return '#dc2626'
  }

  return (
    <table className='results-table'>
      <thead>
        <tr>
          <th>#</th>
          <th>Candidate</th>
          <th>Score</th>
          <th>Skills</th>
          <th>Experience</th>
          <th>Education</th>
          <th>Tier</th>
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