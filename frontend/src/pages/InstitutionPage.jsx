// ─── InstitutionPage.jsx ────────────────────────────────────────────────────
// Design-only redesign. All state, handlers, and API calls are unchanged.

import { useState, useEffect } from 'react'
import { certificateAPI, blockchainAPI } from '../services/api'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/common/StatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import BulkUpload from '../components/institution/BulkUpload'
import { useToast } from '../components/common/Toast'
import { Link } from 'react-router-dom'
import TemplateDesigner from '../components/institution/TemplateDesigner'

/* ── shared table header ── */
const TH = ({ children }) => (
  <th style={{
    padding: '10px 14px', textAlign: 'left',
    fontFamily: 'var(--font-mono)',
    fontSize: 8, color: 'rgba(255,255,255,0.25)',
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(0,212,255,0.07)',
    background: 'rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
  }}>{children}</th>
)

/* ── shared dark card ── */
function DarkCard({ children, accent = 'cyan', style = {} }) {
  const c = accent === 'gold' ? 'var(--gold)' : 'var(--cyan)'
  return (
    <div style={{
      background: 'rgba(9,14,26,0.9)',
      border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c}, ${accent === 'gold' ? 'var(--gold-light)' : 'rgba(0,180,220,1)'})`,
      }} />
      {children}
    </div>
  )
}

/* ── dark form field ── */
function FormField({ label, type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-mono)',
        color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.3)',
        fontSize: 8, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
        marginBottom: 6, transition: 'color 0.2s',
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 9, padding: '10px 14px',
          color: 'var(--white)', fontSize: 13, outline: 'none',
          fontFamily: 'var(--font-body)', transition: 'all 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
        }}
      />
    </div>
  )
}

export default function InstitutionPage() {
  const { user } = useAuth()
  const { show, ToastContainer } = useToast()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadMode, setUploadMode] = useState('single')
  const [form, setForm] = useState({
    holder_name: '', institution_name: user?.full_name || '',
    course_name: '', holder_email: '', issue_date: '', expiry_date: ''
  })
  const [file, setFile] = useState(null)

  useEffect(() => { loadCertificates() }, [])

  const loadCertificates = async () => {
    try {
      const res = await certificateAPI.getAll()
      const data = res.data
      if (Array.isArray(data)) setCertificates(data)
      else if (data.items) setCertificates(data.items)
      else setCertificates([])
    } catch { }
    finally { setLoading(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) { show('Please select a file', 'error'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('holder_name', form.holder_name)
      formData.append('course_name', form.course_name)
      formData.append('issue_date', form.issue_date)
      if (form.expiry_date) formData.append('expiry_date', form.expiry_date)
      if (form.holder_email) formData.append('holder_email', form.holder_email)
      formData.append('file', file)
      const res = await certificateAPI.upload(formData)
      const certId = res.data.certificate_id
      const emailMsg = form.holder_email ? ` Email sent to ${form.holder_email}.` : ''
      show(`Certificate issued! ID: ${certId}.${emailMsg}`, 'success')
      setForm({ holder_name: '', holder_email: '', course_name: '', issue_date: '', expiry_date: '' })
      setFile(null)
      loadCertificates()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) show(`Validation error: ${detail.map(d => d.msg).join(', ')}`, 'error')
      else show(detail || 'Upload failed', 'error')
    } finally { setUploading(false) }
  }

  const retryBlockchain = async (certId) => {
    try {
      const res = await api.post(`/certificates/retry-blockchain/${certId}`)
      show(res.data.success ? 'Blockchain stored!' : res.data.message, res.data.success ? 'success' : 'error')
      loadCertificates()
    } catch { show('Retry failed', 'error') }
  }

  // Metrics
  const today = new Date()
  const in30 = new Date(); in30.setDate(today.getDate() + 30)
  const thisMonth = certificates.filter(c => {
    if (!c.created_at) return false
    const d = new Date(c.created_at)
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })
  const onChain = certificates.filter(c => c.blockchain_tx)
  const blockchainRate = certificates.length > 0 ? Math.round(onChain.length / certificates.length * 100) : 0
  const expiringSoon = certificates.filter(c =>
    c.expiry_date && new Date(c.expiry_date) > today && new Date(c.expiry_date) <= in30 && !c.is_revoked
  )

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'upload',    label: 'Issue Certificate', icon: '➕' },
    { id: 'manage',   label: 'My Certificates', icon: '🎓' },
    { id: 'template', label: 'Template Designer', icon: '🎨' },
  ]

  if (loading) return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner message="Loading dashboard..." />
    </div>
  )

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      <ToastContainer />

      {/* ── HEADER ── */}
      <div style={{
        background: 'rgba(2,8,16,0.9)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: 'clamp(14px,2.5vw,22px) clamp(16px,4vw,32px)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)', opacity: 0.5 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Institution Portal</p>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {user?.full_name || 'Institution Dashboard'}
            </h1>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', color: 'rgba(16,185,129,0.7)',
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)', animation: 'pulse-ring 2s infinite' }} />
            Blockchain Connected
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{
        background: 'rgba(4,9,18,0.95)',
        borderBottom: '1px solid rgba(0,212,255,0.07)',
        padding: '0 clamp(16px,4vw,32px)',
        overflowX: 'auto',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: 'clamp(10px,2vw,14px) clamp(12px,2vw,20px)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
              color: activeTab === tab.id ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--cyan)' : 'transparent'}`,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,32px)' }}>

        {/* ══ DASHBOARD ══ */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
              {[
                { label: 'Total Issued',    value: certificates.length,                  icon: '🎓', color: 'var(--cyan)'    },
                { label: 'This Month',      value: thisMonth.length,                     icon: '📅', color: 'var(--gold)'    },
                { label: 'On Blockchain',   value: onChain.length,                       icon: '⛓️', color: '#A78BFA'       },
                { label: 'Chain Rate',      value: `${blockchainRate}%`,                 icon: '📈', color: 'var(--success)' },
                { label: 'Expiring Soon',   value: expiringSoon.length,                  icon: '⏳', color: 'var(--warning)' },
              ].map((k, i) => (
                <div key={i} style={{
                  background: 'rgba(9,14,26,0.85)', border: `1px solid ${k.color}20`,
                  borderRadius: 14, padding: '15px 16px',
                  position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${k.color}40`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${k.color}20`}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${k.color}, ${k.color}20)`, borderRadius: '3px 0 0 3px' }} />
                  <div style={{ paddingLeft: 8 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{k.icon}</span> {k.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', color: k.color, fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* recent table */}
            <DarkCard style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,212,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
                <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 13, fontWeight: 700 }}>Recent Certificates</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead><tr>{['ID', 'Holder', 'Course', 'Date', 'Status', 'Chain', ''].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                  <tbody>
                    {certificates.slice(0, 10).map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', padding: '2px 7px', borderRadius: 5 }}>{c.certificate_id}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#fff', fontSize: 12, fontWeight: 500 }}>{c.holder_name}</td>
                        <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{c.course_name}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{c.issue_date}</td>
                        <td style={{ padding: '10px 14px' }}><StatusBadge isValid={c.is_valid} isRevoked={c.is_revoked} /></td>
                        <td style={{ padding: '10px 14px' }}>
                          {c.blockchain_tx ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 7px', borderRadius: 5 }}>⛓ ON</span>
                          ) : (
                            <button onClick={() => retryBlockchain(c.certificate_id)} style={{
                              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)',
                              background: 'rgba(201,148,58,0.08)', border: '1px solid rgba(201,148,58,0.2)',
                              padding: '2px 8px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.2s',
                            }}>Retry ⛓</button>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <Link to={`/verify/${c.certificate_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.5)', textDecoration: 'none' }}>View →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DarkCard>
          </div>
        )}

        {/* ══ UPLOAD ══ */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: 680 }}>
            {/* single/bulk toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(9,14,26,0.85)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
              {[{ id: 'single', label: 'Single' }, { id: 'bulk', label: 'Bulk Upload' }].map(m => (
                <button key={m.id} onClick={() => setUploadMode(m.id)} style={{
                  padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                  background: uploadMode === m.id ? 'rgba(0,212,255,0.15)' : 'transparent',
                  color: uploadMode === m.id ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
                  border: uploadMode === m.id ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                }}>{m.label}</button>
              ))}
            </div>

            {uploadMode === 'bulk' ? (
              <BulkUpload onComplete={loadCertificates} />
            ) : (
              <DarkCard>
                <div style={{ padding: 'clamp(20px,4vw,32px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 16, fontWeight: 700 }}>Issue New Certificate</h2>
                  </div>

                  <form onSubmit={handleUpload}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
                      <FormField label="Holder Name" value={form.holder_name} onChange={e => setForm({ ...form, holder_name: e.target.value })} placeholder="Student full name" required />
                      <FormField label="Holder Email (optional)" type="email" value={form.holder_email} onChange={e => setForm({ ...form, holder_email: e.target.value })} placeholder="student@email.com" />
                      <FormField label="Course / Qualification" value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} placeholder="BSc Computer Science" required />
                      <FormField label="Issue Date" type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} required />
                      <FormField label="Expiry Date (optional)" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                    </div>

                    {/* file drop zone */}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Certificate File
                      </label>
                      <label style={{
                        display: 'block',
                        border: `2px dashed ${file ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.15)'}`,
                        borderRadius: 12, padding: 'clamp(20px,3vw,28px)',
                        textAlign: 'center', cursor: 'pointer',
                        background: file ? 'rgba(0,212,255,0.04)' : 'transparent',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                        <p style={{ fontFamily: 'var(--font-body)', color: file ? 'var(--cyan)' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500 }}>
                          {file ? file.name : 'Click to select file'}
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>PDF, JPG, PNG</p>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                      </label>
                    </div>

                    <button type="submit" disabled={uploading} style={{
                      width: '100%',
                      background: uploading ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                      color: uploading ? 'rgba(255,255,255,0.4)' : '#000',
                      border: 'none', borderRadius: 10, padding: '13px',
                      fontSize: 14, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-display)',
                      boxShadow: uploading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
                      transition: 'all 0.2s',
                    }}>
                      {uploading ? 'Issuing...' : '🎓 Issue Certificate'}
                    </button>
                  </form>
                </div>
              </DarkCard>
            )}
          </div>
        )}

        {/* ══ MANAGE ══ */}
        {activeTab === 'manage' && (
          <DarkCard style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,212,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
              <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 13, fontWeight: 700 }}>All Certificates ({certificates.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead><tr>{['ID', 'Holder', 'Course', 'Issue Date', 'Expiry', 'Status', 'Chain'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {certificates.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', padding: '2px 7px', borderRadius: 5 }}>{c.certificate_id}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#fff', fontSize: 12, fontWeight: 500 }}>{c.holder_name}</td>
                      <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{c.course_name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{c.issue_date}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{c.expiry_date || '—'}</td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge isValid={c.is_valid} isRevoked={c.is_revoked} /></td>
                      <td style={{ padding: '10px 14px' }}>
                        {c.blockchain_tx ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 7px', borderRadius: 5 }}>⛓ ON</span>
                        ) : (
                          <button onClick={() => retryBlockchain(c.certificate_id)} style={{
                            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)',
                            background: 'rgba(201,148,58,0.08)', border: '1px solid rgba(201,148,58,0.2)',
                            padding: '2px 8px', borderRadius: 5, cursor: 'pointer',
                          }}>Retry ⛓</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DarkCard>
        )}

        {/* ══ TEMPLATE ══ */}
        {activeTab === 'template' && (
          <div>
            <TemplateDesigner />
          </div>
        )}
      </div>
    </div>
  )
}