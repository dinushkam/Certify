import { useState } from 'react'
import api from '../../services/api'
import { useToast } from '../common/Toast'
import { useAuth } from '../../context/AuthContext'

/* ─── shared label ─── */
const Label = ({ children }) => (
  <p style={{
    fontFamily: 'var(--font-mono)',
    color: 'rgba(255,255,255,0.3)', fontSize: 8,
    fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', marginBottom: 7,
  }}>{children}</p>
)

const inputSt = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '11px 14px',
  color: 'var(--white)', fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-body)', transition: 'all 0.2s',
}

export default function BulkUpload({ onDone }) {
  const { user } = useAuth()
  const { show, ToastContainer } = useToast()
  const [form, setForm] = useState({ course_name: '', issue_date: '' })
  const [csvFile, setCsvFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!csvFile) { show('Please upload a CSV file', 'error'); return }
    setLoading(true)
    setResults(null)
    try {
      const formData = new FormData()
      formData.append('course_name', form.course_name)
      formData.append('issue_date', form.issue_date)
      formData.append('csv_file', csvFile)
      const res = await api.post('/certificates/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResults(res.data)
      show(`${res.data.success} certificates issued. ${res.data.emails_sent || 0} emails sent!`, 'success')
      if (onDone) onDone()
    } catch (err) {
      show(err.response?.data?.detail || 'Bulk upload failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      background: 'rgba(9,14,26,0.9)',
      border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      position: 'relative', overflow: 'hidden',
    }}>
      <ToastContainer />

      {/* top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--cyan), var(--gold))',
      }} />

      <div style={{ padding: 'clamp(20px,3.5vw,30px)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg,var(--cyan),transparent)', borderRadius: 2 }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 16, fontWeight: 700 }}>
            Bulk Certificate Issuance
          </h3>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(0,212,255,0.4)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, marginLeft: 13 }}>
          Upload CSV · Issue Multiple Certificates
        </p>

        {/* institution locked row */}
        <div style={{ marginBottom: 18 }}>
          <Label>Institution Name</Label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 15 }}>🏛️</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--white)', flex: 1 }}>
              {user?.full_name}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8, color: 'var(--gold)', fontWeight: 700,
              background: 'rgba(201,148,58,0.1)', border: '1px solid rgba(201,148,58,0.2)',
              padding: '2px 8px', borderRadius: 100, letterSpacing: '0.1em',
            }}>REGISTERED</span>
          </div>
        </div>

        {/* CSV format guide */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(0,212,255,0.08)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--gold)', opacity: 0.4, borderRadius: 2 }} />
          <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(201,148,58,0.6)', fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 7, paddingLeft: 8 }}>
            CSV Format Required
          </p>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1.9, paddingLeft: 8 }}>
            holder_name, email, expiry_date<br/>
            Kasun Perera, kasun@email.com, 2027-01-01<br/>
            Nimal Silva, nimal@email.com,
          </code>
        </div>

        <form onSubmit={handleSubmit}>
          {/* course */}
          <div style={{ marginBottom: 14 }}>
            <Label>Course / Qualification *</Label>
            <input
              type="text" value={form.course_name}
              onChange={e => setForm({ ...form, course_name: e.target.value })}
              placeholder="BSc Computer Science" required
              style={inputSt}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.4)'; e.target.style.background = 'rgba(0,212,255,0.04)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
          </div>

          {/* date */}
          <div style={{ marginBottom: 18 }}>
            <Label>Issue Date *</Label>
            <input
              type="date" value={form.issue_date}
              onChange={e => setForm({ ...form, issue_date: e.target.value })}
              required
              style={{ ...inputSt, colorScheme: 'dark' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.4)'; e.target.style.background = 'rgba(0,212,255,0.04)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
          </div>

          {/* CSV file drop */}
          <div style={{ marginBottom: 22 }}>
            <Label>Student List CSV *</Label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: `2px dashed ${csvFile ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.15)'}`,
              borderRadius: 14, padding: 'clamp(18px,3vw,28px)',
              cursor: 'pointer',
              background: csvFile ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.02)',
              transition: 'all 0.2s', textAlign: 'center',
            }}
              onMouseEnter={e => { if (!csvFile) { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'; e.currentTarget.style.background = 'rgba(0,212,255,0.04)' } }}
              onMouseLeave={e => { if (!csvFile) { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; e.currentTarget.style.background = 'rgba(0,212,255,0.02)' } }}
            >
              <span style={{ fontSize: 30, marginBottom: 8 }}>{csvFile ? '📊' : '⬆️'}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: csvFile ? 'var(--cyan)' : 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                {csvFile ? csvFile.name : 'Click to upload CSV file'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                .csv only
              </span>
              <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} style={{ display: 'none' }} />
            </label>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: loading ? 'rgba(0,212,255,0.12)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
            color: loading ? 'rgba(255,255,255,0.3)' : '#000',
            border: 'none', borderRadius: 10, padding: '13px',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display)',
            boxShadow: loading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Processing...
              </>
            ) : '🎓 Issue All Certificates'}
          </button>
        </form>

        {/* Results */}
        {results && (
          <div style={{ marginTop: 24 }}>
            {/* stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10, marginBottom: 16,
            }}>
              {[
                { label: 'Total',       value: results.total,              color: 'var(--cyan)'    },
                { label: 'Success',     value: results.success,            color: 'var(--success)' },
                { label: 'Emails Sent', value: results.emails_sent || 0,   color: '#A78BFA'        },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${s.color}20`,
                  borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.4 }} />
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* results list */}
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px',
                  background: r.status === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${r.status === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.15)'}`,
                  borderRadius: 9, fontSize: 12,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--white)', fontFamily: 'var(--font-body)' }}>
                      {r.holder_name}
                    </span>
                    {r.holder_email && (
                      <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{r.holder_email}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.email_sent && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                        color: '#A78BFA', background: 'rgba(167,139,250,0.1)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        padding: '2px 7px', borderRadius: 100, letterSpacing: '0.06em',
                      }}>✉️ SENT</span>
                    )}
                    {r.status === 'success' ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                        color: '#34d399', background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.15)',
                        padding: '2px 8px', borderRadius: 100, letterSpacing: '0.06em',
                      }}>{r.certificate_id}</span>
                    ) : (
                      <span style={{ color: '#f87171', fontSize: 11 }}>Failed: {r.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}