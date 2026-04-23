import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts'
import api, { certificateAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

// ── Chart Tooltip ─────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(5,12,24,0.97)',
      border: '1px solid rgba(0,212,255,0.2)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: 'var(--cyan)', fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 2 }}>
          <span style={{ color: p.color || 'var(--gold)', marginRight: 6 }}>◆</span>
          {p.name}: <strong style={{ color: '#fff' }}>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────
function KPI({ label, value, sub, icon, color = 'var(--cyan)', trend }) {
  return (
    <div style={{
      background: 'rgba(13,27,48,0.8)',
      border: `1px solid ${color}20`,
      borderRadius: 16,
      padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}40`}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${color}20`}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${color}, ${color}30)`,
        borderRadius: '3px 0 0 3px',
      }} />

      <div style={{ paddingLeft: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {label}
          </p>
          <div style={{
            width: 36, height: 36,
            background: `${color}12`,
            border: `1px solid ${color}25`,
            borderRadius: 9,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18,
          }}>{icon}</div>
        </div>
        <p style={{
          fontFamily: 'var(--font-display)',
          color: color, fontSize: 34, fontWeight: 800,
          lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4,
        }}>{value}</p>
        {sub && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Section Card ──────────────────────────────────────────
function Section({ title, subtitle, children, accent = 'cyan' }) {
  const c = accent === 'gold' ? 'var(--gold)' : 'var(--cyan)'
  return (
    <div style={{
      background: 'rgba(13,27,48,0.8)',
      border: '1px solid rgba(0,212,255,0.1)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${c}50, transparent)` }} />
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 4 : 16 }}>
          <div style={{ width: 3, height: 18, background: `linear-gradient(180deg, ${c}, transparent)`, borderRadius: 2 }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 15, fontWeight: 700 }}>{title}</h3>
        </div>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 18, marginLeft: 11 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuth()
  const isInstitution = user?.role === 'institution'

  const [analytics, setAnalytics] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStudentTab, setActiveStudentTab] = useState('all')
  const [studentSearch, setStudentSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      certificateAPI.getAll({ limit: 500 }),
    ])
      .then(([analyticsRes, certsRes]) => {
        setAnalytics(analyticsRes.data)
        const raw = certsRes.data
        setCertificates(Array.isArray(raw) ? raw : raw?.items || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner message="Loading analytics..." />
    </div>
  )

  if (!analytics) return null

  const { stats, monthly_trends, course_breakdown, fraud_distribution } = analytics

  // ── Derived data from certificates ──────────────────────
  const today = new Date()
  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()

  const issuedThisMonth = certificates.filter(c => {
    if (!c.created_at) return false
    const d = new Date(c.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })

  const expiringSoon = certificates.filter(c => {
    if (!c.expiry_date || c.is_revoked) return false
    const exp = new Date(c.expiry_date)
    const in30 = new Date(); in30.setDate(today.getDate() + 30)
    return exp > today && exp <= in30
  })

  const revoked = certificates.filter(c => c.is_revoked)
  const onChain = certificates.filter(c => c.blockchain_tx)
  const fraudAlerts = certificates.filter(c => c.fraud_score && c.fraud_score !== 'pending' && parseFloat(c.fraud_score) > 50)

  // Course distribution
  const courseCounts = {}
  certificates.forEach(c => {
    courseCounts[c.course_name] = (courseCounts[c.course_name] || 0) + 1
  })
  const topCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([course, count]) => ({ course, count }))

  // Monthly this year
  const monthlyThisYear = Array.from({ length: 12 }, (_, i) => {
    const m = new Date(thisYear, i, 1)
    const label = m.toLocaleDateString('en-GB', { month: 'short' })
    const count = certificates.filter(c => {
      if (!c.created_at) return false
      const d = new Date(c.created_at)
      return d.getMonth() === i && d.getFullYear() === thisYear
    }).length
    return { month: label, issued: count }
  })

  // Pie data
  const pieData = [
    { name: 'Low Risk', value: fraud_distribution?.low_risk || 0 },
    { name: 'Medium Risk', value: fraud_distribution?.medium_risk || 0 },
    { name: 'High Risk', value: fraud_distribution?.high_risk || 0 },
  ]
  const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444']

  // Students filter
  const filteredStudents = certificates.filter(c => {
    const matchSearch = !studentSearch ||
      c.holder_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      c.certificate_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (c.course_name || '').toLowerCase().includes(studentSearch.toLowerCase())
    const matchTab = activeStudentTab === 'all' ||
      (activeStudentTab === 'valid' && c.is_valid && !c.is_revoked) ||
      (activeStudentTab === 'revoked' && c.is_revoked) ||
      (activeStudentTab === 'expiring' && expiringSoon.some(e => e.id === c.id)) ||
      (activeStudentTab === 'nochain' && !c.blockchain_tx)
    return matchSearch && matchTab
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: '24px 28px',
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 100, padding: '4px 12px', marginBottom: 8,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)', animation: 'node-pulse 2s ease-in-out infinite' }} />
            <span style={{ color: 'var(--cyan)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {isInstitution ? 'Institution Analytics' : 'System Analytics'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                color: '#fff', fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 700, letterSpacing: '-0.02em',
                marginBottom: 3,
              }}>
                {isInstitution ? `${user.full_name} — Analytics` : 'Analytics Dashboard'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                {isInstitution
                  ? 'Complete overview of your institution\'s certificates and students'
                  : 'Platform-wide certificate and verification statistics'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8, padding: '6px 12px',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ color: '#34d399', fontSize: 11, fontWeight: 600 }}>Live Data</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── KPI Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <KPI label="Total Certificates" value={stats?.total_certificates || 0} sub="All time issued" icon="🎓" color="var(--cyan)" />
          <KPI label="Issued This Month" value={issuedThisMonth.length} sub={`${certificates.length} total`} icon="📅" color="var(--gold)" />
          <KPI label="Blockchain Rate" value={`${stats?.blockchain_coverage || 0}%`} sub={`${onChain.length} on-chain`} icon="⛓️" color="#A78BFA" />
          <KPI label="Fraud Alerts" value={fraudAlerts.length} sub={fraudAlerts.length > 0 ? 'Needs review' : 'All clear'} icon="⚠️" color={fraudAlerts.length > 0 ? '#EF4444' : '#10B981'} />
          <KPI label="Expiring Soon" value={expiringSoon.length} sub="Within 30 days" icon="⏳" color={expiringSoon.length > 0 ? '#F59E0B' : '#10B981'} />
          <KPI label="Validity Rate" value={`${stats?.validity_rate || 0}%`} sub={`${stats?.valid_certificates || 0} valid`} icon="✅" color="#10B981" />
        </div>

        {/* ── Alert Banners ── */}
        {fraudAlerts.length > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ color: '#f87171', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {fraudAlerts.length} certificate{fraudAlerts.length > 1 ? 's' : ''} flagged with high fraud risk
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                Review these certificates: {fraudAlerts.slice(0, 3).map(c => c.certificate_id).join(', ')}{fraudAlerts.length > 3 ? '...' : ''}
              </p>
            </div>
          </div>
        )}

        {expiringSoon.length > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {expiringSoon.length} certificate{expiringSoon.length > 1 ? 's' : ''} expiring within 30 days
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                {expiringSoon.slice(0, 3).map(c => c.holder_name).join(', ')}{expiringSoon.length > 3 ? ' and more...' : ''}
              </p>
            </div>
          </div>
        )}

        {/* ── Row 1: Trends + Fraud ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px,100%), 1fr))', gap: 18, marginBottom: 18 }}>

          {/* Monthly Issuance */}
          <Section title="Certificate Issuance Trends" subtitle={`Monthly breakdown for ${thisYear} — your institution only`}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyThisYear}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="issued"
                  stroke="var(--cyan)" strokeWidth={2.5}
                  fill="url(#cyanGrad)" name="Certificates Issued"
                  dot={{ fill: 'var(--cyan)', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: 'var(--cyan)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* Fraud Risk Pie */}
          <Section title="AI Fraud Risk" subtitle="Certificate analysis results" accent="gold">
            {(fraud_distribution?.total_analyzed || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 10 }}>🤖</div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>AI analysis pending</p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4 }}>Upload certificates to begin</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={7} formatter={v => <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* ── Row 2: Top Courses + All-time Trends ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px,100%), 1fr))', gap: 18, marginBottom: 18 }}>

          {/* Top Courses */}
          <Section title="Top Qualifications" subtitle="Most issued course types from your institution" accent="gold">
            {topCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topCourses.map(({ course, count }, i) => {
                  const maxCount = topCourses[0].count
                  const pct = Math.round((count / maxCount) * 100)
                  const colors = ['var(--gold)', 'var(--cyan)', '#A78BFA', '#34d399', '#f87171', '#fbbf24', '#60a5fa', '#f472b6']
                  return (
                    <div key={course} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: `${colors[i % colors.length]}15`,
                        border: `1px solid ${colors[i % colors.length]}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: colors[i % colors.length],
                        flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{
                            color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            paddingRight: 8,
                          }}>{course}</p>
                          <span style={{ color: colors[i % colors.length], fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[i % colors.length]}70)`,
                            borderRadius: 2, transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* 12-month trend from API */}
          <Section title="12-Month Issuance History" subtitle="Issued vs revoked — all time trends">
            {(!monthly_trends || monthly_trends.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No trend data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthly_trends}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.split(' ')[0]} />
                  <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="issued" stroke="var(--cyan)" strokeWidth={2} dot={false} name="Issued" />
                  <Line type="monotone" dataKey="revoked" stroke="#EF4444" strokeWidth={2} dot={false} name="Revoked" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* ── Student Records Table ── */}
        <Section title="Student Certificate Records" subtitle={`All students from ${isInstitution ? user?.full_name : 'your institution'} — ${certificates.length} total`}>

          {/* Search + Filter bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              flex: 1, minWidth: 220,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, padding: '9px 14px',
              transition: 'border-color 0.2s',
            }}>
              <span style={{ color: 'rgba(0,212,255,0.5)', fontSize: 15, flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search by name, ID or course..."
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', outline: 'none',
                  color: '#fff', fontSize: 13,
                  fontFamily: 'var(--font-body)',
                }}
              />
              {studentSearch && (
                <button onClick={() => setStudentSearch('')} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 14, flexShrink: 0,
                }}>✕</button>
              )}
            </div>

            {/* Tab filters */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'all',      label: `All (${certificates.length})` },
                { id: 'valid',    label: `Valid (${certificates.filter(c => c.is_valid && !c.is_revoked).length})` },
                { id: 'expiring', label: `Expiring (${expiringSoon.length})`, warn: expiringSoon.length > 0 },
                { id: 'revoked',  label: `Revoked (${revoked.length})`, danger: true },
                { id: 'nochain',  label: `No Chain (${certificates.filter(c => !c.blockchain_tx).length})` },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveStudentTab(t.id)} style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: activeStudentTab === t.id
                    ? t.danger ? '1px solid rgba(239,68,68,0.4)' : t.warn ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(0,212,255,0.35)'
                    : '1px solid rgba(255,255,255,0.07)',
                  background: activeStudentTab === t.id
                    ? t.danger ? 'rgba(239,68,68,0.1)' : t.warn ? 'rgba(245,158,11,0.1)' : 'rgba(0,212,255,0.08)'
                    : 'transparent',
                  color: activeStudentTab === t.id
                    ? t.danger ? '#f87171' : t.warn ? '#fbbf24' : 'var(--cyan)'
                    : 'rgba(255,255,255,0.35)',
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {['#', 'Certificate ID', 'Student Name', 'Course / Qualification', 'Issue Date', 'Expiry', 'Fraud Risk', 'Blockchain', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 9, color: 'rgba(255,255,255,0.3)',
                      fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 10 }}>👩‍🎓</div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                        {studentSearch ? 'No students match your search' : 'No certificates yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((cert, idx) => {
                    const isExpired = cert.expiry_date && new Date(cert.expiry_date) < today
                    const isExpiringSoon = expiringSoon.some(e => e.id === cert.id)
                    const fraudScore = cert.fraud_score && cert.fraud_score !== 'pending' ? parseFloat(cert.fraud_score) : null
                    const fraudColor = fraudScore === null ? 'rgba(255,255,255,0.2)'
                      : fraudScore > 70 ? '#EF4444'
                      : fraudScore > 30 ? '#F59E0B'
                      : '#10B981'

                    return (
                      <tr key={cert.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* # */}
                        <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                          {idx + 1}
                        </td>

                        {/* Cert ID */}
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 10,
                            color: 'var(--cyan)',
                            background: 'rgba(0,212,255,0.08)',
                            border: '1px solid rgba(0,212,255,0.15)',
                            padding: '2px 7px', borderRadius: 5,
                            letterSpacing: '0.04em',
                          }}>{cert.certificate_id}</span>
                        </td>

                        {/* Student Name */}
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'rgba(0,212,255,0.1)',
                              border: '1px solid rgba(0,212,255,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: 'var(--cyan)',
                              flexShrink: 0,
                            }}>
                              {cert.holder_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{cert.holder_name}</p>
                              {cert.holder_email && (
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{cert.holder_email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td style={{ padding: '11px 14px' }}>
                          <p style={{
                            color: 'rgba(255,255,255,0.6)', fontSize: 12,
                            maxWidth: 180, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{cert.course_name}</p>
                        </td>

                        {/* Issue Date */}
                        <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.45)', fontSize: 11, whiteSpace: 'nowrap' }}>
                          {cert.issue_date}
                        </td>

                        {/* Expiry */}
                        <td style={{ padding: '11px 14px' }}>
                          {cert.expiry_date ? (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'rgba(255,255,255,0.35)',
                              background: isExpired ? 'rgba(239,68,68,0.1)' : isExpiringSoon ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : isExpiringSoon ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                              padding: '2px 8px', borderRadius: 5,
                              letterSpacing: '0.04em', whiteSpace: 'nowrap',
                            }}>
                              {isExpired ? '⚠ EXPIRED' : isExpiringSoon ? '⏳ SOON' : cert.expiry_date}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>Permanent</span>
                          )}
                        </td>

                        {/* Fraud Risk */}
                        <td style={{ padding: '11px 14px' }}>
                          {cert.fraud_score === 'pending' || !cert.fraud_score ? (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>Pending</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${fraudScore}%`,
                                  background: fraudColor, borderRadius: 2,
                                }} />
                              </div>
                              <span style={{ color: fraudColor, fontSize: 10, fontWeight: 700 }}>
                                {Math.round(fraudScore)}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Blockchain */}
                        <td style={{ padding: '11px 14px' }}>
                          {cert.blockchain_tx ? (
                            <span style={{
                              fontSize: 9, fontWeight: 700,
                              color: '#A78BFA',
                              background: 'rgba(167,139,250,0.1)',
                              border: '1px solid rgba(167,139,250,0.2)',
                              padding: '2px 8px', borderRadius: 5,
                              letterSpacing: '0.04em',
                            }}>⛓ ON-CHAIN</span>
                          ) : (
                            <span style={{
                              fontSize: 9, fontWeight: 600,
                              color: 'rgba(255,255,255,0.2)',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              padding: '2px 8px', borderRadius: 5,
                              letterSpacing: '0.04em',
                            }}>NOT STORED</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '11px 14px' }}>
                          {cert.is_revoked ? (
                            <span style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                              color: '#f87171', padding: '2px 9px', borderRadius: 100,
                              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                            }}>REVOKED</span>
                          ) : cert.is_valid ? (
                            <span style={{
                              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                              color: '#34d399', padding: '2px 9px', borderRadius: 100,
                              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                            }}>VALID</span>
                          ) : (
                            <span style={{
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.3)', padding: '2px 9px', borderRadius: 100,
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            }}>INVALID</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredStudents.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', paddingTop: 14, flexWrap: 'wrap', gap: 8,
            }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                Showing {filteredStudents.length} of {certificates.length} records
                {studentSearch && ` matching "${studentSearch}"`}
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                {[
                  { label: 'Valid', count: certificates.filter(c => c.is_valid && !c.is_revoked).length, color: '#34d399' },
                  { label: 'Revoked', count: revoked.length, color: '#f87171' },
                  { label: 'On-Chain', count: onChain.length, color: '#A78BFA' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{s.label}: </span>
                    <span style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Expiry Warning Table ── */}
        {expiringSoon.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <Section title="Expiring Certificates" subtitle="Students whose certificates expire within 30 days" accent="gold">
              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ background: 'rgba(245,158,11,0.06)' }}>
                      {['Student', 'Course', 'Cert ID', 'Expires', 'Days Left'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          fontSize: 9, color: 'rgba(255,255,255,0.3)',
                          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(245,158,11,0.1)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map(cert => {
                      const daysLeft = Math.ceil((new Date(cert.expiry_date) - today) / (1000 * 60 * 60 * 24))
                      return (
                        <tr key={cert.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 14px', color: '#fff', fontSize: 12, fontWeight: 500 }}>{cert.holder_name}</td>
                          <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{cert.course_name}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)' }}>{cert.certificate_id}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{cert.expiry_date}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800,
                              color: daysLeft <= 7 ? '#EF4444' : '#F59E0B',
                              background: daysLeft <= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                              border: `1px solid ${daysLeft <= 7 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                              padding: '3px 10px', borderRadius: 100,
                            }}>
                              {daysLeft}d left
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

      </div>
    </div>
  )
}