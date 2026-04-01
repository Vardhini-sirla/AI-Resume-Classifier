import { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, FileCheck } from 'lucide-react'

const API_URL = 'https://ai-resume-classifier-7g4y.onrender.com'

function ResumeUpload({ onUploadSuccess }) {
  const [files, setFiles] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFiles = (e) => {
    setFiles([...e.target.files])
  }

  const handleUpload = async () => {
    if (files.length === 0) { setMessage('Please select files'); setMessageType('error'); return }
    setLoading(true)
    let successCount = 0

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await axios.post(`${API_URL}/api/upload`, formData)
        successCount++
      } catch (err) {
        console.error(`Failed to upload ${file.name}`)
      }
    }

    setMessage(`${successCount} of ${files.length} resumes uploaded successfully!`)
    setMessageType('success')
    setFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (onUploadSuccess) onUploadSuccess()
    setLoading(false)
  }

  return (
    <div>
      <div className='upload-area' onClick={() => fileInputRef.current?.click()}>
        <Upload size={36} color='#94a3b8' />
        <p>{files.length > 0 ? `${files.length} file(s) selected` : 'Click to select PDF resumes'}</p>
        <input ref={fileInputRef} type='file' accept='.pdf' multiple onChange={handleFiles} />
      </div>
      <div style={{marginTop: 12, display: 'flex', gap: 8}}>
        <button className='btn btn-primary' onClick={handleUpload} disabled={loading || files.length === 0}>
          {loading ? 'Uploading...' : 'Upload Resumes'}
        </button>
      </div>
      {message && <div className={`message ${messageType}`}>{message}</div>}
    </div>
  )
}

export default ResumeUpload