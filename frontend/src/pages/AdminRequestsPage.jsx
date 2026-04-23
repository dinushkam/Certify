import { useState, useEffect } from 'react'
import { institutionRequestAPI } from '../services/api'
import { useToast } from '../components/common/Toast'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TYPE_LABELS = {
  university: 'University',
  college: 'College / Institute',
  school: 'School',
  professional: 'Professional Body',
  corporate: 'Corporate Training',
}

const STATUS_CFG = {
  pending:  { bg: 'rgba(245,158,11,0.1)',  color: 'var(--warning)', border: 'rgba(245,158,11,0.25)',  label: 'PENDING'  },
  approved: { bg: 'rgba(16,185,129,0.1)',  color: 'var(--success)', border: 'rgba(16,185,129,0.25)', label: 'APPROVED' },
  rejected: { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)',  border: 'rgba(239,68,68,0.25)',  label: 'REJECTED' },
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [approvedResult, setApprovedResult] = useState(null)
  const { show, ToastContainer } = useToast()

  useEffect(() => { loadRequests() }, [filter])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await institutionRequestAPI.getAll(filter || undefined)
      setRequests(res.data)
    } catch { show('Failed to load requests', 'error') }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      const res = await institutionRequestAPI.approve(id)
      setApprovedResult(res.data)
      setSelected(null)
      loadRequests()
      show('Institution approved successfully!', 'success')
    } catch (err) {
      show(err.response?.data?.detail || 'Approval failed', 'error')
    } finally { setProcessing(null) }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return
    setProcessing(id)
    try {
      await institutionRequestAPI.reject(id, reason)
      setSelected(null)
      loadRequests()
      show('Request rejected', 'info')
    } catch (err) {
      show(err.response?.data?.detail || 'Rejection failed', 'error')
    } finally { setProcessing(null) }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const filterTabs = [
    { value: 'pending',  label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: '',         label: 'All' },
  ]

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      <ToastContainer />

      {/* ── HEADER ── */}
      <div style={{
        background: 'rgba(2,8,16,0.9)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,32px)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)',
          opacity: 0.5,
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-mono)', color: 'var(--cyan)',
            fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6,
          }}>Admin Panel</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', color: 'var(--white)',
              fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, letterSpacing: '-0.02em',
            }}>Institution Requests</h1>
            {pendingCount > 0 && filter !== 'pending' && (
              <div style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 100, padding: '6px 16px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 6px var(--warning)', animation: 'pulse-ring 2s infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                  {pendingCount} pending
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,32px) clamp(16px,4vw,32px)' }}>

        {/* ── APPROVED RESULT MODAL ── */}
        {approvedResult && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}>
            <div style={{
              background: 'rgba(6,11,20,0.98)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 24, padding: 'clamp(28px,5vw,40px)',
              maxWidth: 480, width: '100%',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(16,185,129,0.05)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, var(--success), var(--cyan))',
              }} />
              <div style={{
                width: 56, height: 56,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 16, margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                boxShadow: '0 0 24px rgba(16,185,129,0.2)',
              }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
                Institution Approved!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                Account created for <strong style={{ color: 'var(--cyan)' }}>{approvedResult.institution_name}</strong>.
                Share these credentials securely.
              </p>

              {/* credentials */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 12, padding: 18, marginBottom: 24,
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(0,212,255,0.5)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Login Credentials
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Email', value: approvedResult.email, mono: true },
                    { label: 'Temp Password', value: approvedResult.temp_password, mono: true, copyable: true },
                  ].map(({ label, value, mono, copyable }) => (
                    <div key={label}>
                      <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</p>
                      <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(0,212,255,0.1)',
                        borderRadius: 8, padding: '9px 12px',
                        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
                        fontSize: 13, color: 'var(--white)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                        wordBreak: 'break-all',
                      }}>
                        <span>{value}</span>
                        {copyable && (
                          <button
                            onClick={() => navigator.clipboard.writeText(value)}
                            style={{
                              background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
                              color: 'var(--cyan)', borderRadius: 6,
                              padding: '3px 8px', fontSize: 10, cursor: 'pointer',
                              fontFamily: 'var(--font-mono)', flexShrink: 0,
                              transition: 'all 0.2s',
                            }}
                          >Copy</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setApprovedResult(null)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                  color: '#000', border: 'none', borderRadius: 10,
                  padding: '12px', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                  boxShadow: '0 6px 24px rgba(0,212,255,0.35)',
                }}
              >Done</button>
            </div>
          </div>
        )}

        {/* ── DETAIL MODAL ── */}
        {selected && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
            onClick={() => setSelected(null)}
          >
            <div style={{
              background: 'rgba(6,11,20,0.98)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 20, padding: 'clamp(24px,4vw,36px)',
              maxWidth: 560, width: '100%',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
              position: 'relative', overflow: 'hidden',
            }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, var(--cyan), var(--gold))',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Institution Details</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 18, fontWeight: 700 }}>{selected.institution_name}</h2>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 32, height: 32,
                  cursor: 'pointer', fontSize: 16, lineHeight: 1,
                }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  ['Type', TYPE_LABELS[selected.institution_type] || selected.institution_type],
                  ['Contact', selected.contact_name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Website', selected.website],
                  ['Address', selected.address],
                  ['Submitted', new Date(selected.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{k}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleReject(selected.id)} disabled={processing === selected.id} style={{
                    flex: 1, padding: '11px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: processing === selected.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s',
                  }}>Reject</button>
                  <button onClick={() => handleApprove(selected.id)} disabled={processing === selected.id} style={{
                    flex: 2, padding: '11px',
                    background: processing === selected.id ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                    color: processing === selected.id ? 'rgba(255,255,255,0.4)' : '#000',
                    border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: processing === selected.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-display)', boxShadow: processing === selected.id ? 'none' : '0 4px 16px rgba(0,212,255,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    {processing === selected.id ? 'Processing...' : '✓ Approve & Create Account'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FILTER TABS ── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'rgba(9,14,26,0.85)',
          border: '1px solid rgba(0,212,255,0.1)',
          borderRadius: 12, padding: 4,
          width: 'fit-content',
          maxWidth: '100%', overflowX: 'auto',
        }}>
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '8px 20px', borderRadius: 9,
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
                background: filter === tab.value
                  ? 'rgba(0,212,255,0.15)'
                  : 'transparent',
                color: filter === tab.value
                  ? 'var(--cyan)'
                  : 'rgba(255,255,255,0.4)',
                border: filter === tab.value
                  ? '1px solid rgba(0,212,255,0.3)'
                  : '1px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* ── REQUEST CARDS ── */}
        {loading ? <LoadingSpinner /> : requests.length === 0 ? (
          <div style={{
            background: 'rgba(9,14,26,0.85)',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: 18, padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🏛️</div>
            <p style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
              No {filter} requests
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              {filter === 'pending'
                ? 'All caught up! No pending institution requests.'
                : `No ${filter} requests to show.`}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}>
            {requests.map(req => {
              const sc = STATUS_CFG[req.status] || STATUS_CFG.pending
              return (
                <div
                  key={req.id}
                  onClick={() => setSelected(req)}
                  style={{
                    background: 'rgba(9,14,26,0.85)',
                    border: `1px solid ${req.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(0,212,255,0.08)'}`,
                    borderRadius: 16, padding: 'clamp(18px,3vw,24px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = req.status === 'pending' ? 'rgba(245,158,11,0.4)' : 'rgba(0,212,255,0.25)'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = req.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(0,212,255,0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* pending glow line */}
                  {req.status === 'pending' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, transparent, var(--warning), transparent)',
                      opacity: 0.7,
                    }} />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{
                      width: 42, height: 42,
                      background: req.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(0,212,255,0.06)',
                      border: `1px solid ${req.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(0,212,255,0.12)'}`,
                      borderRadius: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>🏛️</div>

                    <span style={{
                      background: sc.bg, color: sc.color,
                      border: `1px solid ${sc.border}`,
                      padding: '3px 10px', borderRadius: 100,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                    }}>{sc.label}</span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 15, fontWeight: 600, marginBottom: 5 }}>
                    {req.institution_name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 3 }}>{req.contact_name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 14 }}>{req.email}</p>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 12, borderTop: '1px solid rgba(0,212,255,0.06)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(0,212,255,0.06)', color: 'rgba(0,212,255,0.5)',
                      border: '1px solid rgba(0,212,255,0.1)',
                      padding: '2px 8px', borderRadius: 5,
                      fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>{TYPE_LABELS[req.institution_type] || req.institution_type}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                      {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={processing === req.id}
                        style={{
                          flex: 1, padding: '8px',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: '#f87171', borderRadius: 8,
                          fontSize: 11, fontWeight: 600,
                          cursor: processing === req.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                        }}
                      >Reject</button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processing === req.id}
                        style={{
                          flex: 2, padding: '8px',
                          background: processing === req.id ? 'rgba(0,212,255,0.1)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                          color: processing === req.id ? 'rgba(255,255,255,0.4)' : '#000',
                          border: 'none', borderRadius: 8,
                          fontSize: 11, fontWeight: 700,
                          cursor: processing === req.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-display)', transition: 'all 0.2s',
                          boxShadow: processing === req.id ? 'none' : '0 3px 12px rgba(0,212,255,0.25)',
                        }}
                      >
                        {processing === req.id ? '...' : '✓ Approve'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}