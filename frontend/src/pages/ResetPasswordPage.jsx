import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*]/.test(password)) score++

  const label = score <= 2 ? 'Weak' : score <= 4 ? 'Fair' : 'Strong'
  const color = score <= 2 ? 'var(--danger)' : score <= 4 ? 'var(--warning)' : 'var(--success)'
  const pct = Math.min((score / 6) * 100, 100)

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Strength</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 2,
          transition: 'width 0.4s, background 0.4s',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  if (!token) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center', color: 'var(--white)', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⛔</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: 24, fontWeight: 700 }}>
            Invalid Reset Link
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 24, fontSize: 14 }}>
            This link is invalid or has expired.
          </p>
          <Link to="/forgot-password" style={{
            background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
            color: '#000', textDecoration: 'none',
            padding: '11px 28px', borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}>Request New Link</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authAPI.resetPassword({ token, new_password: form.new_password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

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

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64,
                background: 'var(--success)',
                borderRadius: 18, margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: 'white',
                boxShadow: '0 0 32px rgba(16,185,129,0.4)',
                animation: 'pulse-ring 1.5s infinite',
              }}>✓</div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)', fontSize: 22,
                fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em',
              }}>Password Reset!</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 14, margin: '0 auto 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>🔐</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--cyan)', letterSpacing: '0.2em',
                  textTransform: 'uppercase', marginBottom: 8,
                }}>◈ New Password ◈</div>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--white)', fontSize: 24,
                  fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em',
                }}>Set New Password</h1>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  Choose a strong password for your account
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
                <div style={{ marginBottom: 18 }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
                  }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.new_password}
                      onChange={e => setForm({ ...form, new_password: e.target.value })}
                      placeholder="Create a strong password"
                      required
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '12px 44px 12px 16px',
                        color: 'var(--white)', fontSize: 14, outline: 'none',
                        fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'rgba(0,212,255,0.4)'
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.06)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 15,
                    }}>{showPwd ? '🙈' : '👁️'}</button>
                  </div>
                  <PasswordStrength password={form.new_password} />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
                  }}>Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    placeholder="Repeat new password"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.confirm_password && form.new_password !== form.confirm_password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10, padding: '12px 16px',
                      color: 'var(--white)', fontSize: 14, outline: 'none',
                      fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = form.confirm_password && form.new_password !== form.confirm_password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}
                  />
                  {form.confirm_password && form.new_password !== form.confirm_password && (
                    <p style={{ color: '#ff8a8a', fontSize: 11, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                      ✕ Passwords do not match
                    </p>
                  )}
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
                  {loading ? 'Resetting...' : '🔐 Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}