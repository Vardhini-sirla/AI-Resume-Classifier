import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import { Upload, FileText, BarChart3, Settings, LogOut } from 'lucide-react'
import ResumeUpload from './components/ResumeUpload'
import ResumeList from './components/ResumeList'
import JobDescription from './components/JobDescription'
import ScoreResults from './components/ScoreResults'
import CandidateModal from './components/CandidateModal'

const API_URL = 'http://localhost:5000'

function App() {
  const [resumes, setResumes] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [filter, setFilter] = useState('all')
  const [weights, setWeights] = useState({ skills: 50, experience: 30, education: 20 })

  const fetchResumes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/resumes`)
      setResumes(res.data.resumes)
    } catch (err) {
      console.error('Failed to fetch resumes', err)
    }
  }

  useEffect(() => { fetchResumes() }, [])

  const handleScoreAll = async (jdText) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/score-all`, { jd_text: jdText })
      setResults(res.data.results)
      fetchResumes()
    } catch (err) {
      alert(err.response?.data?.error || 'Scoring failed')
    }
    setLoading(false)
  }

  const handleScoreSingle = async (resumeId, jdText) => {
    try {
      const res = await axios.post(`${API_URL}/api/score`, {
        resume_id: resumeId,
        jd_text: jdText
      })
      return res.data
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true
    if (filter === 'tier1') return r.tier.includes('Tier 1')
    if (filter === 'tier2') return r.tier.includes('Tier 2')
    if (filter === 'tier3') return r.tier.includes('Tier 3')
    return true
  })

  const stats = {
    total: results.length,
    tier1: results.filter(r => r.tier.includes('Tier 1')).length,
    tier2: results.filter(r => r.tier.includes('Tier 2')).length,
    tier3: results.filter(r => r.tier.includes('Tier 3')).length
  }

  return (
    <div className='dashboard'>
      <aside className='sidebar'>
        <h1>AI Resume Classifier</h1>
        <p>Smart HR Shortlisting</p>
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <BarChart3 size={18} /> Dashboard
        </div>
        <div className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          <Upload size={18} /> Upload Resumes
        </div>
        <div className={`nav-item ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => setActiveTab('resumes')}>
          <FileText size={18} /> All Resumes
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> Settings
        </div>
      </aside>

      <main className='main-content'>
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{marginBottom: 20}}>Dashboard</h2>

            {results.length > 0 && (
              <div className='stats-row'>
                <div className='stat-card'>
                  <div className='label'>Total Candidates</div>
                  <div className='value blue'>{stats.total}</div>
                </div>
                <div className='stat-card'>
                  <div className='label'>Tier 1 - Strong</div>
                  <div className='value green'>{stats.tier1}</div>
                </div>
                <div className='stat-card'>
                  <div className='label'>Tier 2 - Potential</div>
                  <div className='value yellow'>{stats.tier2}</div>
                </div>
                <div className='stat-card'>
                  <div className='label'>Tier 3 - Weak</div>
                  <div className='value red'>{stats.tier3}</div>
                </div>
              </div>
            )}

            <div className='section'>
              <div className='section-header'>
                <h2>Job Description</h2>
              </div>
              <JobDescription onSubmit={handleScoreAll} loading={loading} />
            </div>

            {results.length > 0 && (
              <div className='section'>
                <div className='section-header'>
                  <h2>Candidate Rankings</h2>
                </div>
                <div className='filter-tabs'>
                  <div className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({stats.total})</div>
                  <div className={`filter-tab ${filter === 'tier1' ? 'active' : ''}`} onClick={() => setFilter('tier1')}>Tier 1 ({stats.tier1})</div>
                  <div className={`filter-tab ${filter === 'tier2' ? 'active' : ''}`} onClick={() => setFilter('tier2')}>Tier 2 ({stats.tier2})</div>
                  <div className={`filter-tab ${filter === 'tier3' ? 'active' : ''}`} onClick={() => setFilter('tier3')}>Tier 3 ({stats.tier3})</div>
                </div>
                <ScoreResults results={filteredResults} onSelect={setSelectedCandidate} />
              </div>
            )}
          </>
        )}

        {activeTab === 'upload' && (
          <div className='section'>
            <div className='section-header'>
              <h2>Upload Resumes</h2>
            </div>
            <ResumeUpload onUploadSuccess={fetchResumes} />
          </div>
        )}

        {activeTab === 'resumes' && (
          <div className='section'>
            <div className='section-header'>
              <h2>All Resumes ({resumes.length})</h2>
            </div>
            <ResumeList resumes={resumes} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='section'>
            <div className='section-header'>
              <h2>Scoring Weights</h2>
            </div>
            <p style={{color: '#64748b', fontSize: 14, marginBottom: 20}}>Adjust how much each category affects the total score</p>
            <div className='slider-group'>
              <label><span>Skills</span><span>{weights.skills}%</span></label>
              <input type='range' min='0' max='100' value={weights.skills} onChange={(e) => setWeights({...weights, skills: parseInt(e.target.value)})} />
            </div>
            <div className='slider-group'>
              <label><span>Experience</span><span>{weights.experience}%</span></label>
              <input type='range' min='0' max='100' value={weights.experience} onChange={(e) => setWeights({...weights, experience: parseInt(e.target.value)})} />
            </div>
            <div className='slider-group'>
              <label><span>Education</span><span>{weights.education}%</span></label>
              <input type='range' min='0' max='100' value={weights.education} onChange={(e) => setWeights({...weights, education: parseInt(e.target.value)})} />
            </div>
            <p style={{color: '#94a3b8', fontSize: 13}}>Total: {weights.skills + weights.experience + weights.education}% (should equal 100%)</p>
          </div>
        )}

        {selectedCandidate && (
          <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
        )}
      </main>
    </div>
  )
}

export default App