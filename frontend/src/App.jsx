import { useState } from 'react'
import './App.css'
import ResumeUpload from './components/ResumeUpload'

function App() {
  return (
    <div className='app'>
      <header className='app-header'>
        <h1>AI Resume Classifier</h1>
        <p>Upload resumes to get AI-powered shortlisting</p>
      </header>
      <main>
        <ResumeUpload />
      </main>
    </div>
  )
}

export default App
