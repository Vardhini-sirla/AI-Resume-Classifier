import { useState } from 'react'
import { Play } from 'lucide-react'

function JobDescription({ onSubmit, loading }) {
  const [jdText, setJdText] = useState('')

  return (
    <div>
      <textarea
        className='jd-input'
        placeholder='Paste the job description here... Include requirements, skills, experience level, and education.'
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
      />
      <div style={{marginTop: 12}}>
        <button className='btn btn-success' onClick={() => onSubmit(jdText)} disabled={loading || !jdText.trim()}>
          <Play size={16} />
          {loading ? 'Analyzing Resumes...' : 'Score All Resumes'}
        </button>
      </div>
    </div>
  )
}

export default JobDescription