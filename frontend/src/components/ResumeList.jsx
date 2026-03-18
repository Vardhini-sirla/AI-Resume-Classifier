import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000'

function ResumeList() {
  const [resumes, setResumes] = useState([])

  useEffect(() => {
    axios.get(`${API_URL}/api/resumes`)
      .then(res => setResumes(res.data.resumes))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className='resume-list'>
      <h2>Uploaded Resumes ({resumes.length})</h2>
      {resumes.map(r => (
        <div key={r._id} className='resume-card'>
          <strong>{r.filename}</strong>
          <span>Status: {r.status}</span>
        </div>
      ))}
    </div>
  )
}

export default ResumeList