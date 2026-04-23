import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { institutionRequestAPI } from '../services/api'

const roles = [
  { value: 'employer',    label: 'Employer',    desc: 'Verify candidate credentials',          icon: '🏢', available: true  },
  { value: 'institution', label: 'Institution', desc: 'Universities, colleges, training centers', icon: '🏛️', available: false },
]

/* ─── shared background decoration ─── */
function BgDecor() {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.025) 1px,transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(0,212,255,0.05) 0%,transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 380, height: 380, background: 'radial-gradient(circle,rgba(201,148,58,0.04) 0%,transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
    </>
  )
}

/* ─── dark input field ─── */
function DarkInput({ label, type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontFamily: 'var(--font-mono)',
        color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.3)',
        fontSize: 9, fontWeight: 600, letterSpacing: '0.15em',
        textTransform: 'uppercase', marginBottom: 7, transition: 'color 0.2s',
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, padding: '12px 16px', color: 'var(--white)',
          fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
          transition: 'all 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
        }}
      />
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'employer' })
  const [step, setStep] = useState('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.role === 'institution') { setStep('pending'); return }
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.register(form)
      login(res.data.access_token, res.data.user)
      setStep('success')
      setTimeout(() => navigate('/employer'), 1800)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  /* ─── PENDING SCREEN ─── */
  if (step === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <BgDecor />
        <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'rgba(6,11,20,0.96)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 24, padding: 'clamp(28px,5vw,48px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--cyan),var(--gold),var(--cyan))' }} />

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64,
                background: 'rgba(201,148,58,0.1)', border: '1px solid rgba(201,148,58,0.3)',
                borderRadius: 18, margin: '0 auto 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                boxShadow: '0 0 28px rgba(201,148,58,0.12)',
              }}>🏛️</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>◈ Institution Registration ◈</div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
                Institution Registration Request
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.75, marginBottom: 24 }}>
                Institution accounts require administrator approval to maintain platform integrity. Your request will be reviewed within{' '}
                <strong style={{ color: 'var(--gold)' }}>24–48 hours</strong>.
              </p>
            </div>

            {/* steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {[
                { n: '1', text: 'Submit your institution details below' },
                { n: '2', text: 'Admin reviews and verifies your institution' },
                { n: '3', text: 'You receive approval email with login credentials' },
              ].map(item => (
                <div key={item.n} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px',
                  background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: 10,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{item.n}</div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <InstitutionRequestForm onBack={() => setStep('form')} />
          </div>
        </div>
      </div>
    )
  }

  /* ─── SUCCESS SCREEN ─── */
  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <BgDecor />
        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            background: 'rgba(6,11,20,0.96)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 24, padding: '48px 40px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(16,185,129,0.05)',
          }}>
            <div style={{
              width: 64, height: 64, background: 'var(--success)', borderRadius: 18,
              margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: 'white', boxShadow: '0 0 32px rgba(16,185,129,0.4)',
            }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Account Created!</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 24 }}>Redirecting to your dashboard...</p>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--success)', animation: 'shimmer 1.8s linear forwards', width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── MAIN FORM ─── */
  const fields = [
    { key: 'full_name', label: form.role === 'institution' ? 'Institution / Contact Name' : 'Full Name', type: 'text',     placeholder: form.role === 'institution' ? 'University of Colombo' : 'Kasun Perera' },
    { key: 'email',     label: 'Email Address',                                                           type: 'email',    placeholder: form.role === 'institution' ? 'registrar@institution.lk' : 'you@company.lk' },
    ...(form.role === 'employer' ? [{ key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }] : [])
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <BgDecor />

      <div style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(6,11,20,0.96)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 24,
          padding: 'clamp(28px,5vw,48px) clamp(20px,5vw,40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--cyan),var(--gold),var(--cyan))' }} />
          <div style={{ position: 'absolute', top: 20, left: 20, width: 36, height: 36, borderTop: '1px solid rgba(0,212,255,0.2)', borderLeft: '1px solid rgba(0,212,255,0.2)', borderRadius: '4px 0 0 0', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 20, right: 20, width: 36, height: 36, borderBottom: '1px solid rgba(201,148,58,0.18)', borderRight: '1px solid rgba(201,148,58,0.18)', borderRadius: '0 0 4px 0', pointerEvents: 'none' }} />

          {/* heading */}
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg,rgba(0,212,255,0.1),rgba(201,148,58,0.1))',
              border: '1px solid rgba(0,212,255,0.2)', borderRadius: 14,
              margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <img src="/assets/logoc.png" alt="CertiFy" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>◈ New Account ◈</div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, marginBottom: 5, letterSpacing: '-0.02em' }}>Create Account</h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Join CertiFy Sri Lanka</p>
          </div>

          {/* error banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 18, animation: 'fadeIn 0.3s ease',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
              <span style={{ color: '#ff8a8a', fontSize: 13, flex: 1 }}>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'rgba(255,138,138,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* role picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
                I am registering as
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {roles.map(r => (
                  <div key={r.value} onClick={() => setForm({ ...form, role: r.value })} style={{
                    flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
                    border: form.role === r.value ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    background: form.role === r.value ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s', textAlign: 'center',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: form.role === r.value ? '0 0 16px rgba(0,212,255,0.08)' : 'none',
                  }}>
                    {form.role === r.value && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--cyan)' }} />}
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', color: form.role === r.value ? 'var(--cyan)' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{r.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, lineHeight: 1.4 }}>{r.desc}</div>
                    {!r.available && (
                      <div style={{
                        position: 'absolute', top: -1, right: 8,
                        background: 'linear-gradient(135deg,var(--gold),var(--gold-light))',
                        color: '#000', fontSize: 7, fontWeight: 800,
                        padding: '2px 7px', borderRadius: '0 0 6px 6px',
                        letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                      }}>APPROVAL</div>
                    )}
                  </div>
                ))}
              </div>

              {form.role === 'institution' && (
                <div style={{
                  marginTop: 10, padding: '10px 14px',
                  background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start', animation: 'fadeIn 0.3s ease',
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1, opacity: 0.7 }}>ℹ️</span>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(0,212,255,0.75)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    Institution accounts require admin approval.
                    Clicking "Continue" will submit a request — no password needed yet.
                  </p>
                </div>
              )}
            </div>

            {/* fields */}
            {fields.map(({ key, label, type, placeholder }) => (
              <DarkInput key={key} label={label} type={type}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} required
              />
            ))}

            <button type="submit" disabled={loading} style={{
              width: '100%', marginTop: 6,
              background: loading ? 'rgba(0,212,255,0.12)' : 'linear-gradient(135deg,var(--cyan),rgba(0,180,220,1))',
              color: loading ? 'rgba(255,255,255,0.3)' : '#000',
              border: 'none', borderRadius: 10, padding: '13px',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', boxShadow: loading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,212,255,0.55)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,212,255,0.35)' }}
            >
              {loading ? 'Creating account...' : form.role === 'institution' ? '🏛️ Continue — Request Access →' : '⚡ Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.1)', fontSize: 10, marginTop: 18, letterSpacing: '0.08em' }}>
          🔒 256-bit SSL · Polygon Blockchain Secured
        </p>
      </div>
    </div>
  )
}

/* ─── Institution Request Form ─────────────────────────────────────────────── */
function InstitutionRequestForm({ onBack }) {
  const [form, setForm] = useState({ institution_name: '', contact_name: '', email: '', phone: '', institution_type: 'university', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await institutionRequestAPI.submit(form)
      setSubmitted(true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16,
          margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'var(--success)', boxShadow: '0 0 24px rgba(16,185,129,0.2)',
        }}>✓</div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--white)', fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Request Submitted!</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
          Your institution registration request has been sent to the administrator. You will receive an email at{' '}
          <strong style={{ color: 'var(--cyan)' }}>{form.email}</strong> within 24–48 hours.
        </p>
        <div style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Reference Number</p>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em' }}>REQ-{Date.now().toString().slice(-8)}</p>
        </div>
        <Link to="/login" style={{
          display: 'block', width: '100%', boxSizing: 'border-box',
          background: 'linear-gradient(135deg,var(--cyan),rgba(0,180,220,1))',
          color: '#000', textDecoration: 'none', borderRadius: 10,
          padding: '12px', fontSize: 14, fontWeight: 700,
          fontFamily: 'var(--font-display)', textAlign: 'center',
          boxShadow: '0 6px 24px rgba(0,212,255,0.3)',
        }}>Back to Login</Link>
      </div>
    )
  }

  const fieldDefs = [
    { key: 'institution_name', label: 'Institution Name', placeholder: 'University of Colombo', type: 'text'  },
    { key: 'contact_name',     label: 'Contact Person',   placeholder: 'Prof. Kasun Perera',   type: 'text'  },
    { key: 'email',            label: 'Official Email',   placeholder: 'registrar@cmb.ac.lk',  type: 'email' },
    { key: 'phone',            label: 'Phone Number',     placeholder: '+94 11 258 0048',       type: 'tel'   },
  ]

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      {fieldDefs.map(({ key, label, placeholder, type }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            {label}
          </label>
          <input
            type={type} value={form[key]} required
            onChange={e => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--white)',
              fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.4)'; e.target.style.background = 'rgba(0,212,255,0.04)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
          />
        </div>
      ))}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          Institution Type
        </label>
        <select value={form.institution_type} onChange={e => setForm({ ...form, institution_type: e.target.value })} style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(6,11,20,0.9)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '11px 14px', color: 'var(--white)',
          fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', appearance: 'none', cursor: 'pointer',
        }}>
          <option value="university">University</option>
          <option value="college">College / Institute</option>
          <option value="school">School</option>
          <option value="professional">Professional Body</option>
          <option value="corporate">Corporate Training</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          Additional Message (Optional)
        </label>
        <textarea
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us about your institution and why you need access..."
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '11px 14px', color: 'var(--white)',
            fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
            resize: 'vertical', minHeight: 70, transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onBack} style={{
          flex: 1, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
          borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer',
          fontFamily: 'var(--font-body)', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >← Back</button>
        <button type="submit" disabled={loading} style={{
          flex: 2,
          background: loading ? 'rgba(0,212,255,0.12)' : 'linear-gradient(135deg,var(--cyan),rgba(0,180,220,1))',
          color: loading ? 'rgba(255,255,255,0.3)' : '#000',
          border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(0,212,255,0.3)', transition: 'all 0.2s',
        }}>
          {loading ? 'Submitting...' : '🏛️ Submit Request'}
        </button>
      </div>
    </form>
  )
}