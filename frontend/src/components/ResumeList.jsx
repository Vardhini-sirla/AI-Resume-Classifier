import { FileText, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_URL = 'https://ai-resume-classifier-7g4y.onrender.com'

function ResumeList({ resumes, onDelete, t, selectedResumes, setSelectedResumes }) {
  const selectable = selectedResumes !== undefined && setSelectedResumes !== undefined

  if (!resumes || resumes.length === 0) {
    return <p style={{color: '#64748b'}}>{t.noResumes}</p>
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`${t.deleteConfirm}`)) return
    try {
      await axios.delete(`${API_URL}/api/resumes/${id}`)
      if (onDelete) onDelete()
      if (selectable) setSelectedResumes(prev => prev.filter(sid => sid !== id))
    } catch (err) {
      alert(t.deleteFailed)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`${t.deleteAllConfirm}`)) return
    try {
      await axios.delete(`${API_URL}/api/resumes/all`)
      if (onDelete) onDelete()
      if (selectable) setSelectedResumes([])
    } catch (err) {
      alert(t.deleteFailed)
    }
  }

  const allSelected = selectable && resumes.length > 0 && resumes.every(r => selectedResumes.includes(r._id))
  const someSelected = selectable && selectedResumes.some(id => resumes.find(r => r._id === id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedResumes(prev => prev.filter(id => !resumes.find(r => r._id === id)))
    } else {
      setSelectedResumes(prev => [...new Set([...prev, ...resumes.map(r => r._id)])])
    }
  }

  const toggleOne = (id) => {
    setSelectedResumes(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
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
            {selectable && (
              <th style={{width: 40}}>
                <input
                  type='checkbox'
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={toggleAll}
                  style={{cursor: 'pointer'}}
                />
              </th>
            )}
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
            <tr key={r._id} style={selectable && selectedResumes.includes(r._id) ? {background: '#1e3a5f'} : {}}>
              {selectable && (
                <td>
                  <input
                    type='checkbox'
                    checked={selectedResumes.includes(r._id)}
                    onChange={() => toggleOne(r._id)}
                    style={{cursor: 'pointer'}}
                  />
                </td>
              )}
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
                <button className='btn btn-danger' style={{padding: '4px 8px', fontSize: 12}} onClick={() => handleDelete(r._id)}>
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
