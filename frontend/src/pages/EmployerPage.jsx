// ─── EmployerPage.jsx ─────────────────────────────────────────────────────────
// Design-only redesign. All functions, state, and API calls are unchanged.

import { useState, useRef } from 'react'
import { certificateAPI } from '../services/api'
import StatusBadge from '../components/common/StatusBadge'
import { useToast } from '../components/common/Toast'

const TABS = [
  { id: 'id',     label: 'Enter ID',           icon: '🔤' },
  { id: 'upload', label: 'Upload Certificate',  icon: '📄' },
  { id: 'qr',     label: 'Scan QR Code',        icon: '📷' },
]

/* ── shared dark card ── */
function DarkCard({ children, accent = 'cyan', style = {} }) {
  const c = accent === 'gold' ? 'var(--gold)' : accent === 'success' ? 'var(--success)' : 'var(--cyan)'
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

/* ── info row ── */
function InfoRow({ label, value, mono = false, accent }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(0,212,255,0.05)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        color: accent || 'rgba(255,255,255,0.7)',
        fontSize: mono ? 11 : 12, textAlign: 'right', wordBreak: 'break-all', lineHeight: 1.4,
      }}>{value}</span>
    </div>
  )
}

export default function EmployerPage() {
  const [activeTab, setActiveTab] = useState('id')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { show, ToastContainer } = useToast()

  const handleResult = (data) => { setResult(data); setError('') }
  const handleError  = (msg)  => { setError(msg); setResult(null) }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      <ToastContainer />

      {/* ── HEADER ── */}
      <div style={{
        background: 'rgba(2,8,16,0.9)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: 'clamp(16px,3vw,24px) clamp(16px,4vw,32px)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)', opacity: 0.5 }} />
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Employer Portal</p>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Credential Verification
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px)' }}>

        {/* ── METHOD SELECTOR ── */}
        <DarkCard style={{ padding: 'clamp(20px,4vw,32px)', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Verify a Certificate</h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(0,212,255,0.4)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 22 }}>
            Choose your preferred verification method
          </p>

          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  background: activeTab === tab.id ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeTab === tab.id ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  color: activeTab === tab.id ? 'var(--cyan)' : 'rgba(255,255,255,0.45)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab.id ? '0 0 12px rgba(0,212,255,0.1)' : 'none',
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* ID Tab */}
          {activeTab === 'id' && (
            <IDVerifyForm onResult={handleResult} onError={handleError} loading={loading} setLoading={setLoading} />
          )}
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <UploadVerifyForm onResult={handleResult} onError={handleError} loading={loading} setLoading={setLoading} />
          )}
          {/* QR Tab */}
          {activeTab === 'qr' && (
            <QRVerifySection onResult={handleResult} onError={handleError} />
          )}
        </DarkCard>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 14, padding: '18px 22px', marginBottom: 20, animation: 'fadeIn 0.3s ease',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⛔</span>
            <p style={{ color: '#f87171', fontSize: 13, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* ── RESULT ── */}
        {result && (
          <VerificationResult result={result} />
        )}
      </div>
    </div>
  )
}

/* ── ID Verify Form ── */
function IDVerifyForm({ onResult, onError, loading, setLoading }) {
  const [certId, setCertId] = useState('')
  const [focused, setFocused] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!certId.trim()) return
    setLoading(true)
    try {
      const res = await certificateAPI.verifyFull(certId.trim().toUpperCase())
      onResult(res.data)
    } catch (err) {
      onError(err.response?.status === 404 ? 'Certificate not found.' : 'Verification failed.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleVerify}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, transition: 'color 0.2s' }}>
        Certificate ID
      </label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text" value={certId}
          onChange={e => setCertId(e.target.value.toUpperCase())}
          placeholder="e.g. CERT-2024-XXXXXX"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 200,
            background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding: '12px 16px',
            color: 'var(--white)', fontSize: 14, outline: 'none',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
          }}
        />
        <button type="submit" disabled={loading} style={{
          background: loading ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
          color: loading ? 'rgba(255,255,255,0.4)' : '#000',
          border: 'none', borderRadius: 10, padding: '12px 24px',
          fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-display)',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(0,212,255,0.3)',
          transition: 'all 0.2s', whiteSpace: 'nowrap',
        }}>
          {loading ? 'Verifying...' : '⚡ Verify'}
        </button>
      </div>
    </form>
  )
}

/* ── Upload Verify Form ── */
function UploadVerifyForm({ onResult, onError, loading, setLoading }) {
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await certificateAPI.verifyUpload(fd)
      onResult(res.data)
    } catch (err) {
      onError(err.response?.data?.detail || 'Verification failed.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleUpload}>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${file ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.15)'}`,
          borderRadius: 14, padding: 'clamp(24px,4vw,36px)',
          textAlign: 'center', cursor: 'pointer',
          background: file ? 'rgba(0,212,255,0.04)' : 'rgba(0,212,255,0.02)',
          transition: 'all 0.2s', marginBottom: 14,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'; e.currentTarget.style.background = 'rgba(0,212,255,0.04)' }}
        onMouseLeave={e => { if (!file) { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; e.currentTarget.style.background = 'rgba(0,212,255,0.02)' } }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
        <p style={{ fontFamily: 'var(--font-display)', color: file ? 'var(--cyan)' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
          {file ? file.name : 'Click to upload certificate'}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          PDF, JPG, PNG supported
        </p>
      </div>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
      <button type="submit" disabled={!file || loading} style={{
        width: '100%',
        background: !file || loading ? 'rgba(0,212,255,0.1)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
        color: !file || loading ? 'rgba(255,255,255,0.3)' : '#000',
        border: 'none', borderRadius: 10, padding: '12px',
        fontSize: 13, fontWeight: 700,
        cursor: !file || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-display)',
        boxShadow: !file || loading ? 'none' : '0 4px 16px rgba(0,212,255,0.3)',
        transition: 'all 0.2s',
      }}>
        {loading ? 'Analyzing...' : '📄 Verify Document'}
      </button>
    </form>
  )
}

/* ── QR section ── */
function QRVerifySection({ onResult, onError }) {
  return (
    <div style={{ textAlign: 'center', padding: 'clamp(24px,4vw,40px) 0' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
        margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
      }}>📷</div>
      <p style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
        QR Code Scanner
      </p>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
        Point your camera at the certificate's QR code to verify instantly
      </p>
    </div>
  )
}

/* ── Verification Result ── */
function VerificationResult({ result }) {
  const cert = result?.certificate
  const verification = result?.verification
  const blockchain = result?.blockchain
  const isValid = verification?.overall_valid

  if (!cert) return null

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* status banner */}
      <div style={{
        background: isValid ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
        border: `1px solid ${isValid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        borderRadius: 16, padding: 'clamp(18px,3vw,28px)',
        marginBottom: 16, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: isValid ? 'linear-gradient(90deg, transparent, var(--success), transparent)' : 'linear-gradient(90deg, transparent, var(--danger), transparent)',
        }} />
        <div style={{ fontSize: 'clamp(24px,4vw,40px)', marginBottom: 8 }}>{isValid ? '✅' : '❌'}</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          color: isValid ? '#34d399' : '#f87171',
          fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 700, marginBottom: 6,
        }}>
          {isValid ? 'Certificate Verified' : 'Verification Failed'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          {isValid ? 'This certificate is authentic and blockchain-verified.' : 'This certificate could not be verified.'}
        </p>
      </div>

      <div style={{
        background: 'rgba(9,14,26,0.85)', border: '1px solid rgba(0,212,255,0.1)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--cyan)40, transparent)' }} />
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, var(--cyan), transparent)', borderRadius: 2 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 14, fontWeight: 700 }}>Certificate Details</h3>
          </div>
          <InfoRow label="Holder" value={cert.holder_name} />
          <InfoRow label="Course" value={cert.course_name} />
          <InfoRow label="Institution" value={cert.institution_name} />
          <InfoRow label="Issue Date" value={cert.issue_date} />
          <InfoRow label="Certificate ID" value={cert.certificate_id} mono accent="var(--cyan)" />
          <InfoRow label="Blockchain TX" value={blockchain?.tx_hash} mono accent="#A78BFA" />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <StatusBadge isValid={cert.is_valid} isRevoked={cert.is_revoked} size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}