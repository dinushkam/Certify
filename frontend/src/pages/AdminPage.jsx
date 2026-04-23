import { useState, useEffect } from 'react'
import { certificateAPI } from '../services/api'
import api from '../services/api'
import { useToast } from '../components/common/Toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import StatusBadge from '../components/common/StatusBadge'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#00D4FF', '#C9943A', '#EF4444', '#A78BFA']

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(4,9,18,0.97)',
      border: '1px solid rgba(0,212,255,0.2)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 10, fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>
          <span style={{ color: p.color || 'var(--gold)', marginRight: 6 }}>◆</span>
          {p.name}: <strong style={{ color: '#fff' }}>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* shared KPI card */
function KPICard({ label, value, icon, color = 'var(--cyan)', sub }) {
  return (
    <div style={{
      background: 'rgba(9,14,26,0.85)',
      border: `1px solid ${color}20`,
      borderRadius: 16, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}40`}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${color}20`}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${color}, ${color}20)`,
        borderRadius: '3px 0 0 3px',
      }} />
      <div style={{ paddingLeft: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {label}
          </p>
          <div style={{
            width: 34, height: 34, background: `${color}12`,
            border: `1px solid ${color}25`, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>{icon}</div>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', color, fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {value}
        </p>
        {sub && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{sub}</p>}
      </div>
    </div>
  )
}

/* dark table header */
const TH = ({ children }) => (
  <th style={{
    padding: '10px 14px', textAlign: 'left',
    fontFamily: 'var(--font-mono)',
    fontSize: 8, color: 'rgba(255,255,255,0.25)',
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(0,212,255,0.07)',
    background: 'rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  }}>{children}</th>
)

export default function AdminPage() {
  const [certificates, setCertificates] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [revoking, setRevoking] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterInstitution, setFilterInstitution] = useState('')
  const { show, ToastContainer } = useToast()

  useEffect(() => {
    Promise.all([loadCertificates(), loadAnalytics()]).finally(() => setLoading(false))
  }, [])

  const loadCertificates = async () => {
    try {
      const res = await certificateAPI.getAll()
      const data = res.data
      if (Array.isArray(data)) setCertificates(data)
      else if (data.items) setCertificates(data.items)
      else setCertificates([])
    } catch (err) { console.error(err) }
  }

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/analytics/dashboard')
      setAnalytics(res.data)
    } catch (err) { console.error(err) }
  }

  const handleRevoke = async (certId) => {
    const reason = window.prompt('Enter revocation reason:')
    if (!reason) return
    setRevoking(certId)
    try {
      await certificateAPI.revoke(certId, reason)
      show(`Certificate ${certId} revoked`, 'success')
      loadCertificates(); loadAnalytics()
    } catch { show('Revocation failed', 'error') }
    finally { setRevoking(null) }
  }

  const filtered = certificates.filter(c => {
    const matchSearch = !search ||
      c.certificate_id.toLowerCase().includes(search.toLowerCase()) ||
      c.holder_name.toLowerCase().includes(search.toLowerCase()) ||
      c.institution_name.toLowerCase().includes(search.toLowerCase())
    const matchInstitution = !filterInstitution || c.institution_name === filterInstitution
    const matchStatus = !filterStatus ||
      (filterStatus === 'valid' && c.is_valid && !c.is_revoked) ||
      (filterStatus === 'revoked' && c.is_revoked) ||
      (filterStatus === 'no_blockchain' && !c.blockchain_tx) ||
      (filterStatus === 'expired' && c.expiry_date && new Date(c.expiry_date) < new Date())
    return matchSearch && matchInstitution && matchStatus
  })

  const institutions = [...new Set(certificates.map(c => c.institution_name))]
  const stats = analytics?.stats
  const pieData = analytics?.fraud_distribution ? [
    { name: 'Low Risk',    value: analytics.fraud_distribution.low_risk    || 0 },
    { name: 'Medium Risk', value: analytics.fraud_distribution.medium_risk || 0 },
    { name: 'High Risk',   value: analytics.fraud_distribution.high_risk   || 0 },
  ] : []

  const today = new Date()
  const in30 = new Date(); in30.setDate(today.getDate() + 30)
  const expiringSoon = certificates.filter(c => c.expiry_date && new Date(c.expiry_date) > today && new Date(c.expiry_date) <= in30 && !c.is_revoked)
  const expired = certificates.filter(c => c.expiry_date && new Date(c.expiry_date) < today && !c.is_revoked)

  const tabs = [
    { id: 'overview',      label: 'Overview',      icon: '📊' },
    { id: 'certificates',  label: 'Certificates',  icon: '🎓' },
    { id: 'analytics',     label: 'Analytics',     icon: '📈' },
    { id: 'expiry',        label: `Expiry${expiringSoon.length > 0 ? ` (${expiringSoon.length})` : ''}`, icon: '⏳' },
  ]

  if (loading) return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner message="Loading admin panel..." />
    </div>
  )

  /* shared input style */
  const inputSt = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,212,255,0.1)',
    borderRadius: 9, padding: '9px 14px',
    color: 'var(--white)', fontSize: 12, outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      <ToastContainer />

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: 'rgba(2,8,16,0.9)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: 'clamp(16px,3vw,24px) clamp(16px,4vw,32px)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)',
          opacity: 0.5,
        }} />
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-mono)', color: 'var(--cyan)',
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4,
          }}>System Administration</p>
          <h1 style={{
            fontFamily: 'var(--font-display)', color: 'var(--white)',
            fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, letterSpacing: '-0.02em',
          }}>Admin Control Panel</h1>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{
        background: 'rgba(4,9,18,0.95)',
        borderBottom: '1px solid rgba(0,212,255,0.07)',
        padding: '0 clamp(16px,4vw,32px)',
        overflowX: 'auto',
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'clamp(10px,2vw,14px) clamp(12px,2vw,20px)',
                border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: activeTab === tab.id ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--cyan)' : 'transparent'}`,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,212,255,0.1)' : 'none',
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,32px)' }}>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14, marginBottom: 24,
            }}>
              {[
                { label: 'Total Certificates', value: stats?.total_certificates ?? certificates.length, icon: '🎓', color: 'var(--cyan)' },
                { label: 'Valid & Active',      value: stats?.valid_certificates ?? certificates.filter(c => c.is_valid && !c.is_revoked).length, icon: '✅', color: 'var(--success)' },
                { label: 'Revoked',             value: stats?.revoked_certificates ?? certificates.filter(c => c.is_revoked).length, icon: '🚫', color: 'var(--danger)' },
                { label: 'On Blockchain',       value: certificates.filter(c => c.blockchain_tx).length, icon: '⛓️', color: '#A78BFA' },
                { label: 'Fraud Alerts',        value: stats?.fraud_alerts ?? 0, icon: '⚠️', color: 'var(--warning)' },
                { label: 'Expiring Soon',       value: expiringSoon.length, icon: '⏳', color: 'var(--gold)' },
              ].map((k, i) => (
                <KPICard key={i} {...k} />
              ))}
            </div>

            {/* quick cert table preview */}
            <div style={{
              background: 'rgba(9,14,26,0.85)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--cyan)40, transparent)' }} />
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,212,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
                <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 14, fontWeight: 700 }}>Recent Certificates</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead><tr>{['ID', 'Holder', 'Institution', 'Course', 'Status', 'Chain'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                  <tbody>
                    {certificates.slice(0, 8).map((c, i) => (
                      <tr key={c.id}
                        style={{ borderBottom: '1px solid rgba(0,212,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', padding: '2px 7px', borderRadius: 5 }}>{c.certificate_id}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#fff', fontSize: 12, fontWeight: 500 }}>{c.holder_name}</td>
                        <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{c.institution_name}</td>
                        <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{c.course_name}</td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge isValid={c.is_valid} isRevoked={c.is_revoked} /></td>
                        <td style={{ padding: '11px 14px' }}>
                          {c.blockchain_tx ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.06em' }}>⛓ ON-CHAIN</span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', padding: '2px 7px', borderRadius: 5 }}>PENDING</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ CERTIFICATES ══ */}
        {activeTab === 'certificates' && (
          <div>
            {/* filters */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18,
              alignItems: 'center',
            }}>
              <input
                placeholder="🔍  Search by ID, name or institution..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputSt, flex: '1 1 240px', minWidth: 200 }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.1)'}
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ ...inputSt, flex: '0 1 160px', cursor: 'pointer', appearance: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.1)'}
              >
                <option value="">All Statuses</option>
                <option value="valid">Valid</option>
                <option value="revoked">Revoked</option>
                <option value="no_blockchain">No Blockchain</option>
                <option value="expired">Expired</option>
              </select>
              <select value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)}
                style={{ ...inputSt, flex: '0 1 200px', cursor: 'pointer', appearance: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.1)'}
              >
                <option value="">All Institutions</option>
                {institutions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
              </select>
              <div style={{
                fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)',
                fontSize: 10, letterSpacing: '0.08em', flexShrink: 0,
              }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{
              background: 'rgba(9,14,26,0.85)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead><tr>{['Certificate ID', 'Holder', 'Institution', 'Issue Date', 'Status', 'Chain', 'Action'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                          No certificates found
                        </td>
                      </tr>
                    ) : filtered.map(c => (
                      <tr key={c.id}
                        style={{ borderBottom: '1px solid rgba(0,212,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', padding: '2px 7px', borderRadius: 5 }}>{c.certificate_id}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#fff', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{c.holder_name}</td>
                        <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{c.institution_name}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{c.issue_date}</td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge isValid={c.is_valid} isRevoked={c.is_revoked} /></td>
                        <td style={{ padding: '11px 14px' }}>
                          {c.blockchain_tx ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.06em' }}>⛓ ON-CHAIN</span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', padding: '2px 7px', borderRadius: 5 }}>PENDING</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {!c.is_revoked && (
                            <button
                              onClick={() => handleRevoke(c.certificate_id)}
                              disabled={revoking === c.certificate_id}
                              style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171', borderRadius: 7,
                                padding: '5px 12px', fontSize: 10, fontWeight: 600,
                                cursor: revoking === c.certificate_id ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-body)',
                                opacity: revoking === c.certificate_id ? 0.5 : 1,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { if (revoking !== c.certificate_id) { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
                            >
                              {revoking === c.certificate_id ? '...' : 'Revoke'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {activeTab === 'analytics' && analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 20 }}>
            {/* Monthly trend */}
            {analytics.monthly_trends?.length > 0 && (
              <div style={{
                background: 'rgba(9,14,26,0.85)', border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 18, padding: '20px', gridColumn: '1 / -1',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 14, fontWeight: 700 }}>Monthly Certificate Trends</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.monthly_trends}>
                    <defs>
                      <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'rgba(255,255,255,0.3)' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="certificates" stroke="var(--cyan)" strokeWidth={2} fill="url(#gradCyan)" name="Certificates" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Fraud pie */}
            {pieData.length > 0 && (
              <div style={{ background: 'rgba(9,14,26,0.85)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 18, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, var(--gold), transparent)', borderRadius: 2 }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 14, fontWeight: 700 }}>Fraud Risk Distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Course breakdown */}
            {analytics.course_breakdown?.length > 0 && (
              <div style={{ background: 'rgba(9,14,26,0.85)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 18, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 14, fontWeight: 700 }}>Course Breakdown</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.course_breakdown.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                    <XAxis dataKey="course" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'rgba(255,255,255,0.3)' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="var(--cyan)" opacity={0.7} radius={[4, 4, 0, 0]} name="Certificates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ══ EXPIRY ══ */}
        {activeTab === 'expiry' && (
          <div>
            {/* expiry KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14, marginBottom: 24,
            }}>
              {[
                { label: 'Expiring Within 30 Days', value: expiringSoon.length, icon: '⏳', color: 'var(--warning)' },
                { label: 'Already Expired',          value: expired.length,       icon: '❌', color: 'var(--danger)'  },
                { label: 'No Expiry Set',            value: certificates.filter(c => !c.expiry_date).length, icon: '♾️', color: 'rgba(255,255,255,0.35)' },
              ].map((s, i) => <KPICard key={i} {...s} />)}
            </div>

            {expiringSoon.length > 0 && (
              <div style={{
                background: 'rgba(9,14,26,0.85)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 18, overflow: 'hidden', marginBottom: 20,
              }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(245,158,11,0.1)',
                  background: 'rgba(245,158,11,0.05)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>⏳</span>
                  <p style={{ fontFamily: 'var(--font-display)', color: 'var(--warning)', fontSize: 13, fontWeight: 700 }}>
                    Expiring Within 30 Days — Action Required
                  </p>
                </div>
                <ExpiryTable certs={expiringSoon} type="soon" />
              </div>
            )}

            {expired.length > 0 && (
              <div style={{
                background: 'rgba(9,14,26,0.85)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 18, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(239,68,68,0.1)',
                  background: 'rgba(239,68,68,0.05)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>❌</span>
                  <p style={{ fontFamily: 'var(--font-display)', color: 'var(--danger)', fontSize: 13, fontWeight: 700 }}>
                    Expired Certificates
                  </p>
                </div>
                <ExpiryTable certs={expired} type="expired" />
              </div>
            )}

            {expiringSoon.length === 0 && expired.length === 0 && (
              <div style={{
                background: 'rgba(9,14,26,0.85)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 18, padding: '60px 24px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <p style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500 }}>
                  No expiry issues
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 6 }}>
                  All certificates with expiry dates are still valid
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ExpiryTable({ certs, type }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr>
            {['Certificate ID', 'Holder', 'Institution', 'Course', type === 'soon' ? 'Expires In' : 'Expired On'].map(h => (
              <th key={h} style={{
                padding: '10px 14px', textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: 8, color: 'rgba(255,255,255,0.25)',
                fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                borderBottom: '1px solid rgba(0,212,255,0.06)',
                background: 'rgba(0,0,0,0.2)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {certs.map(cert => {
            const expDate = new Date(cert.expiry_date)
            const today = new Date()
            const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
            return (
              <tr key={cert.id}
                style={{ borderBottom: '1px solid rgba(0,212,255,0.04)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', padding: '2px 7px', borderRadius: 5 }}>{cert.certificate_id}</span>
                </td>
                <td style={{ padding: '11px 14px', color: '#fff', fontSize: 12, fontWeight: 500 }}>{cert.holder_name}</td>
                <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{cert.institution_name}</td>
                <td style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{cert.course_name}</td>
                <td style={{ padding: '11px 14px' }}>
                  {type === 'soon' ? (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10, fontWeight: 700,
                      color: daysLeft <= 7 ? '#f87171' : 'var(--warning)',
                      background: daysLeft <= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${daysLeft <= 7 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      padding: '3px 10px', borderRadius: 100,
                    }}>
                      {daysLeft}d left
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#f87171' }}>
                      {cert.expiry_date}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}