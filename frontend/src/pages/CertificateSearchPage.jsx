import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import StatusBadge from '../components/common/StatusBadge'

function SearchInput({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-mono)',
        color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.35)',
        fontSize: 8, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        marginBottom: 8, transition: 'color 0.2s',
      }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10, padding: '11px 16px',
          color: 'var(--white)', fontSize: 13, outline: 'none',
          fontFamily: 'var(--font-body)',
          transition: 'all 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
        }}
      />
    </div>
  )
}

export default function CertificateSearchPage() {
  const [form, setForm] = useState({
    holder_name: '', institution_name: '', course_name: '', issue_date: ''
  })
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!form.holder_name && !form.institution_name && !form.course_name) {
      setError('Please enter at least one search field')
      return
    }
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (form.holder_name) params.holder_name = form.holder_name
      if (form.institution_name) params.institution_name = form.institution_name
      if (form.course_name) params.course_name = form.course_name
      if (form.issue_date) params.issue_date = form.issue_date

      const res = await api.get('/certificates/search', { params })
      setResults(res.data)
      setSearched(true)
    } catch {
      setError('Search failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'rgba(5,12,20,0.9)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: 'clamp(40px,6vw,72px) 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)',
        }} />

        <p className="section-label" style={{ justifyContent: 'center', marginBottom: 12 }}>
          Certificate Lookup
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--white)',
          fontSize: 'clamp(24px, 5vw, 44px)',
          fontWeight: 700, marginBottom: 10,
          letterSpacing: '-0.02em',
        }}>Find Your Certificate</h1>
        <p style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: 14,
          fontFamily: 'var(--font-body)',
        }}>
          Search by name, institution or course — no login required
        </p>
      </div>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: 'clamp(24px,4vw,40px) 16px' }}>

        {/* ── SEARCH FORM ── */}
        <div style={{
          background: 'rgba(6,11,20,0.95)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 20,
          padding: 'clamp(24px,4vw,36px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold))',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🔍</div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)', fontSize: 17, fontWeight: 600,
              }}>Search Certificates</h2>
              <p style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(0,212,255,0.5)', fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Blockchain Verified Records</p>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px',
              color: '#ff8a8a', fontSize: 13, marginBottom: 18,
            }}>{error}</div>
          )}

          <form onSubmit={handleSearch}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}>
              <SearchInput
                label="Certificate Holder Name"
                value={form.holder_name}
                onChange={e => setForm({ ...form, holder_name: e.target.value })}
                placeholder="e.g. Kasun Perera"
              />
              <SearchInput
                label="Institution Name"
                value={form.institution_name}
                onChange={e => setForm({ ...form, institution_name: e.target.value })}
                placeholder="e.g. University of Colombo"
              />
              <SearchInput
                label="Course / Qualification"
                value={form.course_name}
                onChange={e => setForm({ ...form, course_name: e.target.value })}
                placeholder="e.g. BSc Computer Science"
              />
              <SearchInput
                label="Issue Date"
                type="date"
                value={form.issue_date}
                onChange={e => setForm({ ...form, issue_date: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading
                  ? 'rgba(0,212,255,0.15)'
                  : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                color: loading ? 'rgba(255,255,255,0.4)' : '#000',
                border: 'none', borderRadius: 10, padding: '13px',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                boxShadow: loading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,212,255,0.55)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,212,255,0.35)' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'var(--cyan)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Searching blockchain...
                </>
              ) : '⚡ Search Certificates'}
            </button>
          </form>
        </div>

        {/* ── RESULTS ── */}
        {searched && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '8px 0',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                color: results.length > 0 ? 'var(--cyan)' : 'rgba(255,255,255,0.3)',
                fontSize: 11, letterSpacing: '0.1em',
              }}>
                {results.length > 0
                  ? `◈ ${results.length} record${results.length > 1 ? 's' : ''} found`
                  : '◈ No records found'}
              </div>
            </div>

            {results.map(cert => (
              <div key={cert.id} style={{
                background: 'rgba(6,11,20,0.9)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 14,
                padding: 'clamp(14px,2.5vw,20px) clamp(16px,3vw,24px)',
                marginBottom: 10,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 12,
                transition: 'all 0.25s',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: 'linear-gradient(to bottom, var(--cyan), var(--gold))',
                  borderRadius: '3px 0 0 3px',
                }} />

                <div style={{ paddingLeft: 4 }}>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--white)', fontSize: 'clamp(14px,2vw,17px)',
                    fontWeight: 600, marginBottom: 4,
                  }}>{cert.holder_name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 2 }}>
                    {cert.course_name}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(0,212,255,0.5)', fontSize: 10,
                    letterSpacing: '0.05em',
                  }}>
                    {cert.institution_name} · {cert.issue_date}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge isValid={cert.is_valid} isRevoked={cert.is_revoked} />
                  <Link to={`/verify/${cert.certificate_id}`} style={{
                    background: 'rgba(0,212,255,0.1)',
                    color: 'var(--cyan)',
                    textDecoration: 'none',
                    padding: '7px 16px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    border: '1px solid rgba(0,212,255,0.2)',
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(0,212,255,0.18)'
                      e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(0,212,255,0.1)'
                      e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
                    }}
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <div style={{
            textAlign: 'center', padding: 'clamp(40px,6vw,60px) 24px',
            color: 'rgba(255,255,255,0.25)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.1)',
              margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
            }}>🔍</div>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17, fontWeight: 500,
              color: 'rgba(255,255,255,0.45)', marginBottom: 8,
            }}>
              Search Any Certificate
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
              Enter the holder's name, institution, or course. All records are verified on the Polygon blockchain.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}