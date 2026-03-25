import { FileText } from 'lucide-react'

function ResumeList({ resumes }) {
  if (!resumes || resumes.length === 0) {
    return <p style={{color: '#64748b'}}>No resumes uploaded yet.</p>
  }

  return (
    <table className='results-table'>
      <thead>
        <tr>
          <th>Resume</th>
          <th>Status</th>
          <th>Score</th>
          <th>Tier</th>
          <th>Uploaded</th>
        </tr>
      </thead>
      <tbody>
        {resumes.map(r => (
          <tr key={r._id}>
            <td style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <FileText size={16} color='#3b82f6' />
              {r.filename}
            </td>
            <td>{r.status}</td>
            <td>{r.score ? `${r.score}/100` : '-'}</td>
            <td>
              {r.tier ? (
                <span className={`tier-badge ${r.tier.includes('Tier 1') ? 'tier-1' : r.tier.includes('Tier 2') ? 'tier-2' : 'tier-3'}`}>
                  {r.tier}
                </span>
              ) : '-'}
            </td>
            <td style={{color: '#64748b', fontSize: 13}}>
              {new Date(r.uploaded_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ResumeList