import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const TIER_COLORS = ['#16a34a', '#d97706', '#dc2626']
const SKILL_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981']

export function TierPieChart({ stats, t }) {
  const data = [
    { name: t.tier1Strong, value: stats.tier1 },
    { name: t.tier2Potential, value: stats.tier2 },
    { name: t.tier3Weak, value: stats.tier3 }
  ].filter(d => d.value > 0)

  if (data.length === 0) return null

  return (
    <div style={{width: '100%', height: 280}}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={TIER_COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreBarChart({ results, t }) {
  if (!results || results.length === 0) return null

  const data = results.slice(0, 10).map(r => ({
    name: r.filename.replace('.pdf', '').replace('.docx', '').slice(0, 15),
    [t.skills]: r.breakdown.skills_score,
    [t.experience]: r.breakdown.experience_score,
    [t.education]: r.breakdown.education_score,
    total: r.score
  }))

  return (
    <div style={{width: '100%', height: 320}}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{fontSize: 12}} />
          <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
          <Tooltip
            contentStyle={{borderRadius: 8, border: '1px solid #e2e8f0'}}
            formatter={(value) => `${value}%`}
          />
          <Legend />
          <Bar dataKey={t.skills} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t.experience} fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t.education} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CandidateRadarChart({ candidate, t }) {
  if (!candidate) return null

  const data = [
    { subject: t.skills, score: candidate.breakdown.skills_score, fullMark: 100 },
    { subject: t.experience, score: candidate.breakdown.experience_score, fullMark: 100 },
    { subject: t.education, score: candidate.breakdown.education_score, fullMark: 100 }
  ]

  return (
    <div style={{width: '100%', height: 250}}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{fontSize: 13}} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 11}} />
          <Radar name={t.score} dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          <Tooltip formatter={(value) => `${value}%`} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreDistributionChart({ results, t }) {
  if (!results || results.length === 0) return null

  const ranges = [
    { range: '90-100', count: 0, color: '#16a34a' },
    { range: '75-89', count: 0, color: '#22c55e' },
    { range: '50-74', count: 0, color: '#f59e0b' },
    { range: '25-49', count: 0, color: '#f97316' },
    { range: '0-24', count: 0, color: '#dc2626' }
  ]

  results.forEach(r => {
    if (r.score >= 90) ranges[0].count++
    else if (r.score >= 75) ranges[1].count++
    else if (r.score >= 50) ranges[2].count++
    else if (r.score >= 25) ranges[3].count++
    else ranges[4].count++
  })

  const data = ranges.filter(r => r.count > 0)

  return (
    <div style={{width: '100%', height: 250}}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="range" tick={{fontSize: 12}} />
          <YAxis allowDecimals={false} tick={{fontSize: 12}} />
          <Tooltip />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}