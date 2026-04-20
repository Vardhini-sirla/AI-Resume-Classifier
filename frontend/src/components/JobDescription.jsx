import { useState } from 'react'
import { Play } from 'lucide-react'

function JobDescription({ onSubmit, loading, disabled, t }) {
  const [jdText, setJdText] = useState('')

  return (
    <div>
      <textarea
        className='jd-input'
        placeholder={t.jdPlaceholder}
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
      />
      <div style={{marginTop: 12, display: 'flex', alignItems: 'center', gap: 12}}>
        <button className='btn btn-success' onClick={() => onSubmit(jdText)} disabled={loading || disabled || !jdText.trim()}>
          <Play size={16} />
          {loading ? t.analyzing : t.scoreAll}
        </button>
        {loading && (
          <span style={{color: '#94a3b8', fontSize: 13}}>
            Scoring resumes with AI... this may take 30–60 seconds.
          </span>
        )}
      </div>
    </div>
  )
}

export default JobDescription