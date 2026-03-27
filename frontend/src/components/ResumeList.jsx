import { FileText, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:5000'

function ResumeList({ resumes, onDelete }) {
  if (!resumes || resumes.length === 0) {
    return <p style={{color: '#64748b'}}>No resumes uploaded yet.</p>
  }

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Delete ${filename}?`)) return
    try {
      await axios.delete(`${API_URL}/api/resumes/${id}`)
      if (onDelete) onDelete()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete all ${resumes.length} resumes? This cannot be undone.`)) return
    try {
      await axios.delete(`${API_URL}/api/resumes/all`)
      if (onDelete) onDelete()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
        <button className='btn btn-danger' onClick={handleDeleteAll}>
          <Trash2 size={14} /> Delete All
        </button>
      </div>
      <table className='results-table'>
        <thead>
          <tr>
            <th>Resume</th>
            <th>Status</th>
            <th>Score</th>
            <th>Tier</th>
            <th>Uploaded</th>
            <th>Action</th>
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
              <td>
                <button className='btn btn-danger' style={{padding: '4px 8px', fontSize: 12}} onClick={() => handleDelete(r._id, r.filename)}>
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResumeList