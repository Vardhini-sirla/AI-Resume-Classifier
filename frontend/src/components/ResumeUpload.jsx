import { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, FileCheck } from 'lucide-react'

const API_URL = 'http://localhost:5000'

function ResumeUpload({ onUploadSuccess, t }) {
  const [files, setFiles] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFiles = (e) => {
    setFiles([...e.target.files])
  }

  const handleUpload = async () => {
    if (files.length === 0) { setMessage(t.uploadArea); setMessageType('error'); return }
    setLoading(true)
    let successCount = 0
    const failed = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await axios.post(`${API_URL}/api/upload`, formData)
        successCount++
      } catch (err) {
        const reason = err.response?.data?.errors?.[0] || err.response?.data?.error || 'Upload failed'
        failed.push(`${file.name}: ${reason}`)
      }
    }

    if (failed.length === 0) {
      setMessage(`${successCount} / ${files.length} ${t.uploadSuccess}`)
      setMessageType('success')
    } else {
      const summary = `${successCount} uploaded. ${failed.length} failed:\n${failed.join('\n')}`
      setMessage(summary)
      setMessageType(successCount > 0 ? 'success' : 'error')
    }

    setFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (onUploadSuccess) onUploadSuccess()
    setLoading(false)
  }

  return (
    <div>
      <div className='upload-area' onClick={() => fileInputRef.current?.click()}>
        <Upload size={36} color='#94a3b8' />
        <p>{files.length > 0 ? `${files.length} ${t.filesSelected}` : t.uploadArea}</p>
        <input ref={fileInputRef} type='file' accept='.pdf,.docx,.doc' multiple onChange={handleFiles} />
      </div>
      <div style={{marginTop: 12, display: 'flex', gap: 8}}>
        <button className='btn btn-primary' onClick={handleUpload} disabled={loading || files.length === 0}>
          {loading ? t.uploading : t.uploadButton}
        </button>
      </div>
      {message && <div className={`message ${messageType}`}>{message}</div>}
    </div>
  )
}

export default ResumeUpload