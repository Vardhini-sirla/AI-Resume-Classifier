import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import { Upload, FileText, BarChart3, Settings, Globe } from 'lucide-react'
import ResumeUpload from './components/ResumeUpload'
import ResumeList from './components/ResumeList'
import JobDescription from './components/JobDescription'
import ScoreResults from './components/ScoreResults'
import CandidateModal from './components/CandidateModal'
import translations, { languageNames } from './translations'

const API_URL = 'https://ai-resume-classifier-7g4y.onrender.com'

function App() {
  const [resumes, setResumes] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [filter, setFilter] = useState('all')
  const [weights, setWeights] = useState({ skills: 50, experience: 30, education: 20 })
  const [lang, setLang] = useState('en')

  const t = translations[lang]

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
      alert(t.scoringFailed)
    }
    setLoading(false)
  }

  const exportResults = async (format) => {
    try {
      const res = await axios.post(`${API_URL}/api/export/${format}`,
        { results },
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `resume_rankings.${format === 'excel' ? 'xlsx' : 'pdf'}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(t.exportFailed)
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
        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <BarChart3 size={18} /> {t.dashboard}
        </div>
        <div className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          <Upload size={18} /> {t.uploadResumes}
        </div>
        <div className={`nav-item ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => setActiveTab('resumes')}>
          <FileText size={18} /> {t.allResumes}
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> {t.settings}
        </div>

        <div style={{marginTop: 'auto', paddingTop: 30}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginBottom: 8}}>
            <Globe size={14} /> {t.language}
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #475569', background: '#334155', color: 'white', fontSize: 13, cursor: 'pointer'}}
          >
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </aside>

      <main className='main-content'>
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{marginBottom: 20}}>{t.dashboard}</h2>

            {results.length > 0 && (
              <div className='stats-row'>
                <div className='stat-card'>
                  <div className='label'>{t.totalCandidates}</div>
                  <div className='value blue'>{stats.total}</div>
                </div>
                <div className='stat-card'>
                  <div className='label'>{t.tier1Strong}</div>
                  <div className='value green'>{stats.tier1}</div>
                </div>
                <div className='stat-card'>
                  <div className='label'>{t.tier2Potential}</div>
                  <div className='value yellow'>{stats.tier2}</div>
                </div>
                <div className='stat-card'>
                  <div className='label'>{t.tier3Weak}</div>
                  <div className='value red'>{stats.tier3}</div>
                </div>
              </div>
            )}

            <div className='section'>
              <div className='section-header'>
                <h2>{t.jobDescription}</h2>
              </div>
              <JobDescription onSubmit={handleScoreAll} loading={loading} t={t} />
            </div>

            {results.length > 0 && (
              <div className='section'>
                <div className='section-header'>
                  <h2>{t.candidateRankings}</h2>
                  <div style={{display: 'flex', gap: 8}}>
                    <button className='btn btn-outline' onClick={() => exportResults('excel')}>{t.exportExcel}</button>
                    <button className='btn btn-outline' onClick={() => exportResults('pdf')}>{t.exportPdf}</button>
                  </div>
                </div>
                <div className='filter-tabs'>
                  <div className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t.all} ({stats.total})</div>
                  <div className={`filter-tab ${filter === 'tier1' ? 'active' : ''}`} onClick={() => setFilter('tier1')}>Tier 1 ({stats.tier1})</div>
                  <div className={`filter-tab ${filter === 'tier2' ? 'active' : ''}`} onClick={() => setFilter('tier2')}>Tier 2 ({stats.tier2})</div>
                  <div className={`filter-tab ${filter === 'tier3' ? 'active' : ''}`} onClick={() => setFilter('tier3')}>Tier 3 ({stats.tier3})</div>
                </div>
                <ScoreResults results={filteredResults} onSelect={setSelectedCandidate} t={t} />
              </div>
            )}
          </>
        )}

        {activeTab === 'upload' && (
          <div className='section'>
            <div className='section-header'>
              <h2>{t.uploadResumes}</h2>
            </div>
            <ResumeUpload onUploadSuccess={fetchResumes} t={t} />
          </div>
        )}

        {activeTab === 'resumes' && (
          <div className='section'>
            <div className='section-header'>
              <h2>{t.allResumes} ({resumes.length})</h2>
            </div>
            <ResumeList resumes={resumes} onDelete={fetchResumes} t={t} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='section'>
            <div className='section-header'>
              <h2>{t.scoringWeights}</h2>
            </div>
            <p style={{color: '#64748b', fontSize: 14, marginBottom: 20}}>{t.weightDescription}</p>
            <div className='slider-group'>
              <label><span>{t.skills}</span><span>{weights.skills}%</span></label>
              <input type='range' min='0' max='100' value={weights.skills} onChange={(e) => setWeights({...weights, skills: parseInt(e.target.value)})} />
            </div>
            <div className='slider-group'>
              <label><span>{t.experience}</span><span>{weights.experience}%</span></label>
              <input type='range' min='0' max='100' value={weights.experience} onChange={(e) => setWeights({...weights, experience: parseInt(e.target.value)})} />
            </div>
            <div className='slider-group'>
              <label><span>{t.education}</span><span>{weights.education}%</span></label>
              <input type='range' min='0' max='100' value={weights.education} onChange={(e) => setWeights({...weights, education: parseInt(e.target.value)})} />
            </div>
            <p style={{color: '#94a3b8', fontSize: 13}}>{t.total}: {weights.skills + weights.experience + weights.education}% {t.shouldEqual100}</p>
          </div>
        )}

        {selectedCandidate && (
          <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} t={t} />
        )}
      </main>
    </div>
  )
}

export default App