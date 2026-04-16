import { useState } from 'react'
import { Play } from 'lucide-react'

function JobDescription({ onSubmit, loading, t }) {
  const [jdText, setJdText] = useState('')

  return (
    <div>
      <textarea
        className='jd-input'
        placeholder={t.jdPlaceholder}
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
      />
      <div style={{marginTop: 12}}>
        <button className='btn btn-success' onClick={() => onSubmit(jdText)} disabled={loading || !jdText.trim()}>
          <Play size={16} />
          {loading ? t.analyzing : t.scoreAll}
        </button>
      </div>
    </div>
  )
}

export default JobDescription