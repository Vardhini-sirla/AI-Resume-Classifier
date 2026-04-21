import { useState } from 'react'
import axios from 'axios'
import { LogIn, UserPlus, Mail, Lock, User, Building } from 'lucide-react'

const API_URL = 'https://ai-resume-classifier-7g4y.onrender.com'

function AuthPage({ onLogin, t }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        onLogin(res.data.user, res.data.token)
      } else {
        if (!name) { setError('Name is required'); setLoading(false); return }
        const res = await axios.post(`${API_URL}/api/auth/signup`, { name, email, password, company })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        onLogin(res.data.user, res.data.token)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{textAlign: 'center', marginBottom: 30}}>
          <div style={{
            width: 60, height: 60, background: '#3b82f6', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <FileIcon />
          </div>
          <h1 style={{fontSize: 24, color: '#1e293b', marginBottom: 4}}>AI Resume Classifier</h1>
          <p style={{color: '#64748b', fontSize: 14}}>Smart HR Shortlisting Platform</p>
        </div>

        <div style={{display: 'flex', gap: 0, marginBottom: 24}}>
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: isLogin ? '#3b82f6' : '#f1f5f9',
              color: isLogin ? 'white' : '#64748b',
              borderRadius: '8px 0 0 8px',
              transition: 'all 0.2s'
            }}
          >
            <LogIn size={14} style={{verticalAlign: 'middle', marginRight: 6}} />
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: !isLogin ? '#3b82f6' : '#f1f5f9',
              color: !isLogin ? 'white' : '#64748b',
              borderRadius: '0 8px 8px 0',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={14} style={{verticalAlign: 'middle', marginRight: 6}} />
            Sign Up
          </button>
        </div>

        {!isLogin && (
          <>
            <div style={{position: 'relative', marginBottom: 16}}>
              <User size={16} color='#94a3b8' style={{position: 'absolute', left: 12, top: 12}} />
              <input
                type='text'
                placeholder='Full Name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  width: '100%', padding: '10px 10px 10px 38px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{position: 'relative', marginBottom: 16}}>
              <Building size={16} color='#94a3b8' style={{position: 'absolute', left: 12, top: 12}} />
              <input
                type='text'
                placeholder='Company (optional)'
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  width: '100%', padding: '10px 10px 10px 38px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box'
                }}
              />
            </div>
          </>
        )}

        <div style={{position: 'relative', marginBottom: 16}}>
          <Mail size={16} color='#94a3b8' style={{position: 'absolute', left: 12, top: 12}} />
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%', padding: '10px 10px 10px 38px', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{position: 'relative', marginBottom: 20}}>
          <Lock size={16} color='#94a3b8' style={{position: 'absolute', left: 12, top: 12}} />
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%', padding: '10px 10px 10px 38px', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
            borderRadius: 8, fontSize: 13, marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', background: loading ? '#94a3b8' : '#3b82f6',
            color: 'white', border: 'none', borderRadius: 8, fontSize: 15,
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
        </button>

        <p style={{textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 20}}>
          Your resume data is encrypted and secure
        </p>
      </div>
    </div>
  )
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  )
}

export default AuthPage