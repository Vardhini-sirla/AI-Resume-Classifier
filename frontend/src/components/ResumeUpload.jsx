import { useState } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000'

function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) { setMessage('Please select a file'); return }
    const formData = new FormData()
    formData.append('file', file)
    setLoading(true)
    try {
      const res = await axios.post(
        `${API_URL}/api/upload`, formData
      )
      setMessage(`Success! ${res.data.filename} uploaded.`)
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed')
    }
    setLoading(false)
  }

  return (
    <div className='upload-section'>
      <h2>Upload Resume</h2>
      <input type='file' accept='.pdf'
        onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p className='message'>{message}</p>}
    </div>
  )
}

export default ResumeUpload