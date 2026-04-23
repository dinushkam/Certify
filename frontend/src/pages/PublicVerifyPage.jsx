import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { certificateAPI } from '../services/api'
import VerificationReport from '../components/VerificationReport'

/* ── small shared helpers ── */
function InfoRow({ label, value, mono = false }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid rgba(0,212,255,0.06)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10, letterSpacing: '0.08em',
        textTransform: 'uppercase', flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        color: 'rgba(255,255,255,0.75)',
        fontSize: mono ? 11 : 13,
        fontWeight: mono ? 500 : 400,
        textAlign: 'right', lineHeight: 1.4,
        wordBreak: 'break-all',
      }}>{value}</span>
    </div>
  )
}

function SectionCard({ title, icon, children, accent = 'cyan' }) {
  const c = accent === 'gold' ? 'var(--gold)' : accent === 'success' ? 'var(--success)' : accent === 'danger' ? 'var(--danger)' : 'var(--cyan)'
  return (
    <div style={{
      background: 'rgba(9,14,26,0.85)',
      border: `1px solid ${c}15`,
      borderRadius: 16, overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${c}40, transparent)` }} />
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 3, height: 16,
            background: `linear-gradient(180deg, ${c}, transparent)`,
            borderRadius: 2,
          }} />
          <span style={{ fontSize: 14 }}>{icon}</span>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--white)', fontSize: 14, fontWeight: 600,
          }}>{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function PublicVerifyPage() {
  const { certificateId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [inputId, setInputId] = useState(certificateId || '')
  const [focused, setFocused] = useState(false)
  const printRef = useRef()

  useEffect(() => {
    if (certificateId) fetchCert(certificateId)
  }, [certificateId])

  const fetchCert = async (id) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await certificateAPI.verifyFull(id.trim().toUpperCase())
      setResult(res.data)
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'No certificate found with this ID.'
          : 'Verification failed. Please try again.'
      )
    } finally { setLoading(false) }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (inputId.trim()) {
      navigate(`/verify/${inputId.trim().toUpperCase()}`)
      fetchCert(inputId.trim())
    }
  }

  const handlePrint = () => window.print()
  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: 'Certificate Verification', url })
    else { navigator.clipboard.writeText(url); alert('Link copied to clipboard!') }
  }

  const cert = result?.certificate
  const verification = result?.verification
  const blockchain = result?.blockchain
  const isValid = verification?.overall_valid

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <div style={{
        background: 'rgba(2,8,16,0.9)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: 'clamp(36px,6vw,64px) 24px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)',
          opacity: 0.6,
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.04) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="section-label" style={{ justifyContent: 'center', marginBottom: 12 }}>
            Blockchain Verification
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--white)',
            fontSize: 'clamp(22px, 5vw, 42px)',
            fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em',
          }}>Verify Certificate</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            Enter a certificate ID to check authenticity on the blockchain
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: 'clamp(24px,4vw,40px) 16px' }}>

        {/* ── SEARCH ── */}
        <div style={{
          background: 'rgba(6,11,20,0.95)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 20, padding: 'clamp(20px,4vw,32px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold))',
          }} />

          <form onSubmit={handleSearch}>
            <label style={{
              display: 'block', fontFamily: 'var(--font-mono)',
              color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.3)',
              fontSize: 9, fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', marginBottom: 10, transition: 'color 0.2s',
            }}>Certificate ID</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={inputId}
                onChange={e => setInputId(e.target.value.toUpperCase())}
                placeholder="e.g. CERT-2024-XXXXXX"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  flex: 1, minWidth: 200,
                  background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: '12px 16px',
                  color: 'var(--white)', fontSize: 14, outline: 'none',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                  transition: 'all 0.2s',
                  boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                  color: loading ? 'rgba(255,255,255,0.4)' : '#000',
                  border: 'none', borderRadius: 10,
                  padding: '12px 24px',
                  fontSize: 13, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(0,212,255,0.3)',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 12, height: 12,
                      border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--cyan)',
                      borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block',
                    }} />
                    Verifying...
                  </span>
                ) : '⚡ Verify'}
              </button>
            </div>
          </form>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 14, padding: '20px 24px',
            textAlign: 'center', marginBottom: 20, animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⛔</div>
            <p style={{ color: '#f87171', fontSize: 14, fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {/* ── RESULT ── */}
        {result && cert && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* status banner */}
            <div style={{
              background: isValid
                ? 'rgba(16,185,129,0.07)'
                : 'rgba(239,68,68,0.07)',
              border: `1px solid ${isValid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              borderRadius: 16, padding: 'clamp(16px,3vw,24px)',
              marginBottom: 16, textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: isValid ? 'linear-gradient(90deg, transparent, var(--success), transparent)' : 'linear-gradient(90deg, transparent, var(--danger), transparent)',
              }} />
              <div style={{ fontSize: 'clamp(28px,5vw,44px)', marginBottom: 8 }}>
                {isValid ? '✅' : '❌'}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: isValid ? '#34d399' : '#f87171',
                fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em',
              }}>
                {isValid ? 'Certificate Verified' : 'Verification Failed'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {isValid
                  ? 'This certificate is authentic and has been verified on the blockchain.'
                  : 'This certificate could not be verified. It may be invalid or revoked.'}
              </p>
            </div>

            {/* cert details */}
            <SectionCard title="Certificate Details" icon="🎓" accent="cyan">
              <InfoRow label="Holder" value={cert.holder_name} />
              <InfoRow label="Course" value={cert.course_name} />
              <InfoRow label="Institution" value={cert.institution_name} />
              <InfoRow label="Issue Date" value={cert.issue_date} />
              <InfoRow label="Expiry Date" value={cert.expiry_date || 'No Expiry'} />
              <InfoRow label="Certificate ID" value={cert.certificate_id} mono />
            </SectionCard>

            {/* blockchain */}
            {blockchain && (
              <SectionCard title="Blockchain Record" icon="⛓️" accent="gold">
                <InfoRow label="Network" value={blockchain.network || 'Polygon'} />
                <InfoRow label="Transaction" value={blockchain.tx_hash} mono />
                <InfoRow label="Block" value={blockchain.block_number} mono />
                <InfoRow label="Timestamp" value={blockchain.timestamp} />
              </SectionCard>
            )}

            {/* verification checks */}
            {verification && (
              <SectionCard title="Verification Checks" icon="🔍" accent={isValid ? 'success' : 'danger'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(verification).filter(([k]) => k !== 'overall_valid').map(([key, val]) => (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: val ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                      border: `1px solid ${val ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
                      borderRadius: 8,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        color: 'rgba(255,255,255,0.55)', fontSize: 12,
                        textTransform: 'capitalize',
                      }}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        color: val ? '#34d399' : '#f87171',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      }}>
                        {val ? '✓ PASS' : '✕ FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <button onClick={handlePrint} style={{
                flex: 1, minWidth: 120,
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: 'var(--cyan)', borderRadius: 10,
                padding: '11px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)' }}
              >🖨️ Print</button>
              <button onClick={handleShare} style={{
                flex: 1, minWidth: 120,
                background: 'rgba(201,148,58,0.08)',
                border: '1px solid rgba(201,148,58,0.2)',
                color: 'var(--gold)', borderRadius: 10,
                padding: '11px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,148,58,0.15)'; e.currentTarget.style.borderColor = 'rgba(201,148,58,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,148,58,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,148,58,0.2)' }}
              >🔗 Share</button>
              {result && (
                <button onClick={() => setShowReport(!showReport)} style={{
                  flex: 1, minWidth: 120,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)', borderRadius: 10,
                  padding: '11px 16px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                >📄 {showReport ? 'Hide' : 'Full'} Report</button>
              )}
            </div>

            {showReport && result && (
              <div ref={printRef} style={{ marginTop: 20 }}>
                <VerificationReport result={result} />
              </div>
            )}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!result && !loading && !error && (
          <div style={{
            textAlign: 'center', padding: 'clamp(40px,6vw,60px) 24px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.1)',
              margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
            }}>⛓️</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Enter a Certificate ID Above
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
              Every verified certificate is permanently stored on the Polygon blockchain network.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}