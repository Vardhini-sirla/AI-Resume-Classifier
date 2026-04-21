import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_URL = 'https://ai-resume-classifier-7g4y.onrender.com'

const COLORS = ['#3b82f6', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1']

function AnalyticsPage({ t }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API_URL}/api/analytics`)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { setError('Score some resumes first to see analytics'); setLoading(false) })
  }, [])

  if (loading) return <div style={{textAlign: 'center', padding: 40, color: '#64748b'}}>Loading analytics...</div>
  if (error) return <div style={{textAlign: 'center', padding: 40, color: '#64748b'}}>{error}</div>
  if (!data) return null

  const veteranData = [
    { name: 'Veterans', value: data.veteran.veterans },
    { name: 'Non-Veterans', value: data.veteran.non_veterans }
  ]

  const authData = Object.entries(data.work_authorization).map(([key, val]) => ({
    name: key === 'unknown' ? 'Not Specified' : key,
    value: val
  }))

  const relocationData = [
    { name: 'Willing to Relocate', value: data.relocation.willing },
    { name: 'Not Willing / Unknown', value: data.relocation.not_willing }
  ]

  const certData = [
    { name: 'Has Certifications', value: data.certifications.has_certifications },
    { name: 'No Certifications', value: data.certifications.no_certifications }
  ]

  const availData = Object.entries(data.availability).map(([key, val]) => ({
    name: key === 'unknown' ? 'Not Specified' : key,
    value: val
  }))

  const skillsData = data.top_skills.map(s => ({
    name: s.skill.length > 15 ? s.skill.slice(0, 15) + '...' : s.skill,
    count: s.count
  }))

  const expData = Object.entries(data.experience_distribution).map(([key, val]) => ({
    name: key,
    count: val
  }))

  const eduData = Object.entries(data.education_levels).filter(([k, v]) => v > 0).map(([key, val]) => ({
    name: key,
    value: val
  }))

  const locationData = Object.entries(data.location).map(([key, val]) => ({
    name: key.length > 20 ? key.slice(0, 20) + '...' : key,
    count: val
  }))

  const renderPieChart = (chartData, title) => (
    <div className='section' style={{marginBottom: 0}}>
      <h3 style={{fontSize: 16, marginBottom: 12}}>{title}</h3>
      <div style={{width: '100%', height: 280}}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderBarChart = (chartData, title, dataKey = 'count') => (
    <div className='section' style={{marginBottom: 0}}>
      <h3 style={{fontSize: 16, marginBottom: 12}}>{title}</h3>
      <div style={{width: '100%', height: 280}}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{fontSize: 11}} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{fontSize: 12}} />
            <Tooltip />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <div>
      <h2 style={{marginBottom: 8}}>Candidate Analytics</h2>
      <p style={{color: '#64748b', fontSize: 14, marginBottom: 24}}>
        Detailed breakdown of {data.total_candidates} scored candidates across demographics, qualifications, and availability.
      </p>

      <div className='stats-row'>
        <div className='stat-card'>
          <div className='label'>Total Scored</div>
          <div className='value blue'>{data.total_candidates}</div>
        </div>
        <div className='stat-card'>
          <div className='label'>Veterans</div>
          <div className='value green'>{data.veteran.veterans}</div>
        </div>
        <div className='stat-card'>
          <div className='label'>With Certifications</div>
          <div className='value yellow'>{data.certifications.has_certifications}</div>
        </div>
        <div className='stat-card'>
          <div className='label'>Willing to Relocate</div>
          <div className='value blue'>{data.relocation.willing}</div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
        {renderPieChart(veteranData, 'Veteran Status')}
        {renderPieChart(authData, 'Work Authorization')}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
        {renderPieChart(relocationData, 'Relocation Willingness')}
        {renderPieChart(certData, 'Certifications')}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
        {renderBarChart(availData, 'Availability / Notice Period', 'value')}
        {renderBarChart(expData, 'Experience Distribution')}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
        {renderBarChart(skillsData, 'Top 15 Skills Across All Candidates')}
        {renderPieChart(eduData, 'Education Levels')}
      </div>

      {locationData.length > 0 && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16}}>
          {renderBarChart(locationData, 'Candidate Locations')}
        </div>
      )}

      {Object.keys(data.certifications.top_certifications).length > 0 && (
        <div className='section'>
          <h3 style={{fontSize: 16, marginBottom: 12}}>Top Certifications</h3>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {Object.entries(data.certifications.top_certifications).map(([cert, count]) => (
              <span key={cert} className='skill-tag skill-matched' style={{fontSize: 13, padding: '6px 14px'}}>
                {cert} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage