// ─── ForgotPasswordPage.jsx ────────────────────────────────────────────────
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'

function AuthBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Request failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <AuthBg />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(6,11,20,0.95)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 24,
          padding: 'clamp(32px,5vw,48px) clamp(24px,5vw,40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold), var(--cyan))',
          }} />

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64,
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: 18,
                margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 0 32px rgba(0,212,255,0.15)',
                animation: 'pulse-ring 2s infinite',
              }}>✉️</div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)', fontSize: 22,
                fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em',
              }}>Check Your Email</h2>
              <p style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 14, lineHeight: 1.75, marginBottom: 24,
              }}>
                Reset link sent to{' '}
                <strong style={{ color: 'var(--cyan)' }}>{email}</strong>.
                {' '}Expires in 1 hour.
              </p>
              <div style={{
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 24,
              }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.6 }}>
                  Didn't receive it? Check your spam folder or{' '}
                  <button onClick={() => setSent(false)} style={{
                    background: 'none', border: 'none',
                    color: 'var(--cyan)', cursor: 'pointer', fontSize: 12, padding: 0,
                  }}>try again</button>.
                </p>
              </div>
              <Link to="/login" style={{
                display: 'block',
                background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                color: '#000', textDecoration: 'none',
                padding: '12px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, textAlign: 'center',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 6px 24px rgba(0,212,255,0.35)',
              }}>Back to Sign In</Link>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 14,
                  margin: '0 auto 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>🔑</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--cyan)', letterSpacing: '0.2em',
                  textTransform: 'uppercase', marginBottom: 8,
                }}>◈ Password Recovery ◈</div>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--white)', fontSize: 24,
                  fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em',
                }}>Forgot Password?</h1>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  Enter your email and we'll send a reset link
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10, padding: '10px 14px',
                  color: '#ff8a8a', fontSize: 13, marginBottom: 20,
                }}>{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
                    fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
                    transition: 'color 0.2s',
                  }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@institution.lk"
                    required
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10, padding: '12px 16px',
                      color: 'var(--white)', fontSize: 14, outline: 'none',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.2s',
                      boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? 'rgba(0,212,255,0.2)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                    color: loading ? 'rgba(255,255,255,0.4)' : '#000',
                    border: 'none', borderRadius: 10, padding: '13px',
                    fontSize: 14, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-display)',
                    boxShadow: loading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Sending...' : '📧 Send Reset Link'}
                </button>
              </form>

              <p style={{
                textAlign: 'center', color: 'rgba(255,255,255,0.25)',
                fontSize: 13, marginTop: 20,
              }}>
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
                  ← Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}