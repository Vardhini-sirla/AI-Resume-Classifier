import { FileText, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:5000'

function ResumeList({ resumes, onDelete, t }) {
  if (!resumes || resumes.length === 0) {
    return <p style={{color: '#64748b'}}>{t.noResumes}</p>
  }

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`${t.deleteConfirm}`)) return
    try {
      await axios.delete(`${API_URL}/api/resumes/${id}`)
      if (onDelete) onDelete()
    } catch (err) {
      alert(t.deleteFailed)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`${t.deleteAllConfirm}`)) return
    try {
      await axios.delete(`${API_URL}/api/resumes/all`)
      if (onDelete) onDelete()
    } catch (err) {
      alert(t.deleteFailed)
    }
  }

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
        <button className='btn btn-danger' onClick={handleDeleteAll}>
          <Trash2 size={14} /> {t.deleteAll}
        </button>
      </div>
      <table className='results-table'>
        <thead>
          <tr>
            <th>{t.candidate}</th>
            <th>{t.status}</th>
            <th>{t.score}</th>
            <th>{t.tier}</th>
            <th>{t.uploaded}</th>
            <th>{t.action}</th>
          </tr>
        </thead>
        <tbody>
          {resumes.map(r => (
            <tr key={r._id}>
              <td style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <FileText size={16} color='#3b82f6' />
                {r.filename}
              </td>
              <td>
                {r.status === 'extracting' ? (
                  <span style={{color: '#f59e0b', fontSize: 12, fontWeight: 600}}>⏳ Extracting...</span>
                ) : r.status === 'extraction_failed' ? (
                  <span style={{color: '#ef4444', fontSize: 12, fontWeight: 600}}>⚠ Failed</span>
                ) : r.status === 'extracted' ? (
                  <span style={{color: '#22c55e', fontSize: 12}}>✓ Ready</span>
                ) : r.status === 'scored' ? (
                  <span style={{color: '#3b82f6', fontSize: 12}}>✓ Scored</span>
                ) : (
                  <span style={{color: '#94a3b8', fontSize: 12}}>{r.status}</span>
                )}
              </td>
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