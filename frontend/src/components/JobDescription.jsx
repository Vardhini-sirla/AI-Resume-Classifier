import { useState } from 'react'

function JobDescription({ onSubmit, loading }) {
  const [jdText, setJdText] = useState('')

  return (
    <div className='jd-section'>
      <h2>Job Description</h2>
      <textarea
        placeholder='Paste the job description here...'
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={6}
      />
      <button onClick={() => onSubmit(jdText)} disabled={loading || !jdText}>
        {loading ? 'Scoring...' : 'Score All Resumes'}
      </button>
    </div>
  )
}

export default JobDescription