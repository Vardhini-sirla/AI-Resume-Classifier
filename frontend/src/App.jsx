import { useState } from 'react'
import axios from 'axios'
import './App.css'
import ResumeUpload from './components/ResumeUpload'
import ResumeList from './components/ResumeList'
import JobDescription from './components/JobDescription'
import ScoreResults from './components/ScoreResults'

const API_URL = 'http://localhost:5000'

function App() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleScoreAll = async (jdText) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/score-all`, {
        jd_text: jdText
      })
      setResults(res.data.results)
    } catch (err) {
      alert(err.response?.data?.error || 'Scoring failed')
    }
    setLoading(false)
  }

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>AI Resume Classifier</h1>
        <p>Upload resumes to get AI-powered shortlisting</p>
      </header>
      <main>
        <ResumeUpload />
        <ResumeList />
        <JobDescription onSubmit={handleScoreAll} loading={loading} />
        <ScoreResults results={results} />
      </main>
    </div>
  )
}

export default App