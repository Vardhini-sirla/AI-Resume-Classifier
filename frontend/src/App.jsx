import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import { Upload, FileText, BarChart3, Settings, Globe, TrendingUp, Users, Award, AlertTriangle } from 'lucide-react'
import ResumeUpload from './components/ResumeUpload'
import ResumeList from './components/ResumeList'
import JobDescription from './components/JobDescription'
import ScoreResults from './components/ScoreResults'
import CandidateModal from './components/CandidateModal'
import AuthPage from './components/AuthPage'
import AnalyticsPage from './components/AnalyticsPage'
import { TierPieChart, ScoreBarChart, ScoreDistributionChart, CandidateRadarChart } from './components/Charts'
import translations, { languageNames } from './translations'

const API_URL = 'http://localhost:5000'

function App() {
  const [resumes, setResumes] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [filter, setFilter] = useState('all')
  const [weights, setWeights] = useState({ skills: 60, experience: 25, education: 15 })
  const [lang, setLang] = useState('en')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [extractingCount, setExtractingCount] = useState(0)
  const [selectedResumes, setSelectedResumes] = useState([])

  const t = translations[lang]

  const fetchResumes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/resumes`)
      setResumes(res.data.resumes)
      const stillExtracting = res.data.resumes.filter(r => r.status === 'extracting').length
      setExtractingCount(stillExtracting)
    } catch (err) {
      console.error('Failed to fetch resumes', err)
    }
  }

  useEffect(() => { fetchResumes() }, [])

  // Poll every 3 seconds while resumes are still being extracted
  useEffect(() => {
    if (extractingCount === 0) return
    const interval = setInterval(fetchResumes, 3000)
    return () => clearInterval(interval)
  }, [extractingCount])

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      axios.get(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      }).then(res => {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
        setAuthLoading(false)
      }).catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthLoading(false)
      })
    } else {
      setAuthLoading(false)
    }
  }, [])

  const handleLogin = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
  }

  const handleLogout = () => {
    axios.post(`${API_URL}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setResults([])
  }

  const handleScoreAll = async (jdText) => {
    const weightTotal = weights.skills + weights.experience + weights.education
    if (weightTotal !== 100) {
      alert(`Scoring weights must sum to 100. Current total: ${weightTotal}%. Go to Settings to fix this.`)
      return
    }
    setLoading(true)
    try {
      let res
      if (selectedResumes.length > 0) {
        res = await axios.post(`${API_URL}/api/score-selected`, {
          resume_ids: selectedResumes,
          jd_text: jdText,
          weights: weights,
        })
      } else {
        res = await axios.post(`${API_URL}/api/score-all`, {
          jd_text: jdText,
          weights: weights,
        })
      }
      setResults(res.data.results)
      fetchResumes()
    } catch (err) {
      const msg = err.response?.data?.error || err.message || t.scoringFailed
      alert(`Scoring failed:\n\n${msg}`)
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
    tier3: results.filter(r => r.tier.includes('Tier 3')).length,
    avgScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0,
    topScore: results.length > 0 ? Math.max(...results.map(r => r.score)) : 0
  }

  const descriptions = {
    dashboard: {
      en: "Welcome to the AI Resume Classifier Dashboard. Upload resumes, paste a job description, and let AI score and rank your candidates automatically. View analytics, filter by tier, and export results.",
      zh: "欢迎使用AI简历分类系统仪表板。上传简历，粘贴职位描述，让AI自动评分和排名候选人。查看分析，按等级筛选，导出结果。",
      es: "Bienvenido al Panel del Clasificador de CV con IA. Sube CVs, pega una descripción del puesto y deja que la IA puntúe y clasifique a tus candidatos automáticamente.",
      hi: "AI रिज्यूमे क्लासिफायर डैशबोर्ड में आपका स्वागत है। रिज्यूमे अपलोड करें, जॉब विवरण पेस्ट करें, और AI को स्वचालित रूप से स्कोर करने दें।",
      fr: "Bienvenue sur le tableau de bord du Classificateur de CV par IA. Téléchargez des CVs et laissez l'IA évaluer vos candidats automatiquement.",
      de: "Willkommen beim KI-Lebenslauf-Klassifikator. Laden Sie Lebensläufe hoch und lassen Sie die KI Ihre Kandidaten automatisch bewerten.",
      ja: "AI履歴書分類システムへようこそ。履歴書をアップロードし、求人内容を貼り付けて、AIに自動的に評価させましょう。",
      ko: "AI 이력서 분류 시스템에 오신 것을 환영합니다. 이력서를 업로드하고 직무 설명을 붙여넣으면 AI가 자동으로 평가합니다.",
      ar: "مرحباً بك في لوحة تحكم نظام تصنيف السيرة الذاتية بالذكاء الاصطناعي. قم برفع السير الذاتية ودع الذكاء الاصطناعي يقيم المرشحين تلقائياً.",
      te: "AI రెజ్యూమ్ క్లాసిఫైయర్ డాష్‌బోర్డ్‌కు స్వాగతం. రెజ్యూమ్‌లను అప్‌లోడ్ చేయండి మరియు AI స్వయంచాలకంగా అంచనా వేయనివ్వండి."
    },
    upload: {
      en: "Upload candidate resumes in PDF or DOCX format. You can upload multiple files at once. Each resume will be parsed and stored for AI-powered analysis.",
      zh: "上传PDF或DOCX格式的候选人简历。您可以一次上传多个文件。每份简历将被解析并存储以进行AI分析。",
      es: "Sube CVs de candidatos en formato PDF o DOCX. Puedes subir múltiples archivos a la vez.",
      hi: "PDF या DOCX प्रारूप में उम्मीदवार रिज्यूमे अपलोड करें। आप एक बार में कई फाइलें अपलोड कर सकते हैं।",
      fr: "Téléchargez des CVs au format PDF ou DOCX. Vous pouvez télécharger plusieurs fichiers à la fois.",
      de: "Laden Sie Lebensläufe im PDF- oder DOCX-Format hoch. Sie können mehrere Dateien gleichzeitig hochladen.",
      ja: "PDFまたはDOCX形式の履歴書をアップロードしてください。複数ファイルを一度にアップロードできます。",
      ko: "PDF 또는 DOCX 형식의 이력서를 업로드하세요. 여러 파일을 한 번에 업로드할 수 있습니다.",
      ar: "قم برفع السير الذاتية بصيغة PDF أو DOCX. يمكنك رفع عدة ملفات في وقت واحد.",
      te: "PDF లేదా DOCX ఆకృతిలో అభ్యర్థి రెజ్యూమ్‌లను అప్‌లోడ్ చేయండి."
    },
    resumes: {
      en: "View and manage all uploaded resumes. See their current score, tier classification, and upload date. Delete individual resumes or clear all data.",
      zh: "查看和管理所有上传的简历。查看当前分数、等级分类和上传日期。删除单个简历或清除所有数据。",
      es: "Ver y gestionar todos los CVs subidos. Ver su puntuación actual, nivel y fecha de subida.",
      hi: "सभी अपलोड किए गए रिज्यूमे देखें और प्रबंधित करें।",
      fr: "Consultez et gérez tous les CVs téléchargés.",
      de: "Alle hochgeladenen Lebensläufe anzeigen und verwalten.",
      ja: "アップロードされたすべての履歴書を表示・管理します。",
      ko: "업로드된 모든 이력서를 보고 관리하세요.",
      ar: "عرض وإدارة جميع السير الذاتية المرفوعة.",
      te: "అప్‌లోడ్ చేసిన అన్ని రెజ్యూమ్‌లను చూడండి మరియు నిర్వహించండి."
    },
    settings: {
      en: "Customize how the scoring algorithm weighs different categories. Skills, Experience, and Education each contribute to the total score. The default is 50/30/20 but you can adjust based on your hiring priorities.",
      zh: "自定义评分算法如何权衡不同类别。技能、经验和教育各自对总分有贡献。默认为50/30/20，但您可以根据招聘优先级进行调整。",
      es: "Personaliza cómo el algoritmo pondera diferentes categorías. La configuración predeterminada es 50/30/20.",
      hi: "स्कोरिंग एल्गोरिदम को कस्टमाइज़ करें। डिफ़ॉल्ट 50/30/20 है।",
      fr: "Personnalisez la pondération de l'algorithme. Par défaut: 50/30/20.",
      de: "Passen Sie die Gewichtung des Algorithmus an. Standard: 50/30/20.",
      ja: "スコアリングアルゴリズムの重み付けをカスタマイズ。デフォルト: 50/30/20。",
      ko: "채점 알고리즘의 가중치를 조정하세요. 기본값: 50/30/20.",
      ar: "خصص كيفية ترجيح خوارزمية التقييم. الافتراضي: 50/30/20.",
      te: "స్కోరింగ్ అల్గారిథమ్‌ను అనుకూలీకరించండి. డిఫాల్ట్: 50/30/20."
    }
  }

  if (authLoading) {
    return <div style={{minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9'}}>
      <p style={{color: '#64748b'}}>Loading...</p>
    </div>
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} t={t} />
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
        <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={18} /> {t.analytics}
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
          <div style={{marginTop: 16, padding: '10px 0', borderTop: '1px solid #334155'}}>
            <p style={{color: '#94a3b8', fontSize: 12, marginBottom: 8}}>Hi, {user.name}</p>
            {user.company && <p style={{color: '#64748b', fontSize: 11, marginBottom: 8}}>{user.company}</p>}
            <button
              onClick={handleLogout}
              style={{width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #475569', background: '#334155', color: '#f87171', fontSize: 12, cursor: 'pointer'}}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className='main-content'>
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{marginBottom: 8}}>{t.dashboard}</h2>
            <p style={{color: '#64748b', fontSize: 14, marginBottom: 24}}>{descriptions.dashboard[lang] || descriptions.dashboard.en}</p>

            {results.length > 0 && (
              <>
                <div className='stats-row'>
                  <div className='stat-card'>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                      <Users size={18} color='#3b82f6' />
                      <div className='label'>{t.totalCandidates}</div>
                    </div>
                    <div className='value blue'>{stats.total}</div>
                  </div>
                  <div className='stat-card'>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                      <Award size={18} color='#16a34a' />
                      <div className='label'>{t.tier1Strong}</div>
                    </div>
                    <div className='value green'>{stats.tier1}</div>
                  </div>
                  <div className='stat-card'>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                      <TrendingUp size={18} color='#d97706' />
                      <div className='label'>{t.tier2Potential}</div>
                    </div>
                    <div className='value yellow'>{stats.tier2}</div>
                  </div>
                  <div className='stat-card'>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                      <AlertTriangle size={18} color='#dc2626' />
                      <div className='label'>{t.tier3Weak}</div>
                    </div>
                    <div className='value red'>{stats.tier3}</div>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24}}>
                  <div className='stat-card'>
                    <div className='label'>Average Score</div>
                    <div className='value blue'>{stats.avgScore}<span style={{fontSize: 14, color: '#94a3b8'}}>/100</span></div>
                  </div>
                  <div className='stat-card'>
                    <div className='label'>Top Score</div>
                    <div className='value green'>{stats.topScore}<span style={{fontSize: 14, color: '#94a3b8'}}>/100</span></div>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24}}>
                  <div className='section' style={{marginBottom: 0}}>
                    <h3 style={{fontSize: 16, marginBottom: 12}}>Tier Distribution</h3>
                    <TierPieChart stats={stats} t={t} />
                  </div>
                  <div className='section' style={{marginBottom: 0}}>
                    <h3 style={{fontSize: 16, marginBottom: 12}}>Score Distribution</h3>
                    <ScoreDistributionChart results={results} t={t} />
                  </div>
                </div>

                <div className='section'>
                  <h3 style={{fontSize: 16, marginBottom: 12}}>Candidate Comparison — Skills vs Experience vs Education</h3>
                  <ScoreBarChart results={results} t={t} />
                </div>
              </>
            )}

            {extractingCount > 0 && (
              <div style={{background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite'}} />
                <span style={{color: '#92400e', fontSize: 14}}>
                  <strong>{extractingCount} resume{extractingCount > 1 ? 's' : ''}</strong> still being processed by AI... Scoring will be available once complete.
                </span>
              </div>
            )}

            {resumes.length > 0 && (
              <div className='section'>
                <div className='section-header'>
                  <h2>Select Resumes</h2>
                  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                    {selectedResumes.length > 0 && (
                      <span style={{color: '#3b82f6', fontSize: 13, fontWeight: 600}}>
                        {selectedResumes.length} selected
                      </span>
                    )}
                    <button
                      className='btn btn-outline'
                      style={{padding: '4px 10px', fontSize: 12}}
                      onClick={() => setSelectedResumes(resumes.map(r => r._id))}
                    >
                      Select All
                    </button>
                    <button
                      className='btn btn-outline'
                      style={{padding: '4px 10px', fontSize: 12}}
                      onClick={() => setSelectedResumes([])}
                      disabled={selectedResumes.length === 0}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
                <p style={{color: '#64748b', fontSize: 13, marginBottom: 12}}>
                  Choose specific resumes to score, or leave unselected to score all.
                </p>
                <div style={{maxHeight: 240, overflowY: 'auto'}}>
                  {resumes.map(r => (
                    <label
                      key={r._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 6, cursor: 'pointer', marginBottom: 4,
                        background: selectedResumes.includes(r._id) ? '#1e3a5f' : '#1e293b',
                        border: `1px solid ${selectedResumes.includes(r._id) ? '#3b82f6' : '#334155'}`,
                      }}
                    >
                      <input
                        type='checkbox'
                        checked={selectedResumes.includes(r._id)}
                        onChange={() => setSelectedResumes(prev =>
                          prev.includes(r._id) ? prev.filter(id => id !== r._id) : [...prev, r._id]
                        )}
                        style={{cursor: 'pointer', accentColor: '#3b82f6'}}
                      />
                      <span style={{fontSize: 13, color: '#e2e8f0', flex: 1}}>{r.filename}</span>
                      {r.status === 'extracting' && <span style={{color: '#f59e0b', fontSize: 11}}>⏳ Processing</span>}
                      {r.score && <span style={{color: '#94a3b8', fontSize: 11}}>{r.score}/100</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className='section'>
              <div className='section-header'>
                <h2>{t.jobDescription}</h2>
              </div>
              <JobDescription onSubmit={handleScoreAll} loading={loading} disabled={extractingCount > 0} t={t} selectedCount={selectedResumes.length} />
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
            <p style={{color: '#64748b', fontSize: 14, marginBottom: 20}}>{descriptions.upload[lang] || descriptions.upload.en}</p>
            <ResumeUpload onUploadSuccess={fetchResumes} t={t} />
          </div>
        )}

        {activeTab === 'resumes' && (
          <div className='section'>
            <div className='section-header'>
              <h2>{t.allResumes} ({resumes.length})</h2>
            </div>
            <p style={{color: '#64748b', fontSize: 14, marginBottom: 20}}>{descriptions.resumes[lang] || descriptions.resumes.en}</p>
            <ResumeList resumes={resumes} onDelete={fetchResumes} t={t} selectedResumes={selectedResumes} setSelectedResumes={setSelectedResumes} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className='section'>
            <AnalyticsPage t={t} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='section'>
            <div className='section-header'>
              <h2>{t.scoringWeights}</h2>
            </div>
            <p style={{color: '#64748b', fontSize: 14, marginBottom: 20}}>{descriptions.settings[lang] || descriptions.settings.en}</p>
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
            {(() => {
              const total = weights.skills + weights.experience + weights.education
              const ok = total === 100
              return (
                <p style={{color: ok ? '#22c55e' : '#f87171', fontSize: 13, fontWeight: ok ? 'normal' : 600}}>
                  {t.total}: {total}% {ok ? '✓' : `— ${t.shouldEqual100}`}
                </p>
              )
            })()}
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