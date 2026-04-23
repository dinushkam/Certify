import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function PasswordStrength({ password }) {
  const getStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[!@#$%^&*]/.test(pwd)) score++
    return score
  }

  const score = getStrength(password)
  const label = score <= 2 ? 'Weak' : score <= 4 ? 'Fair' : 'Strong'
  const color = score <= 2 ? 'var(--danger)' : score <= 4 ? 'var(--warning)' : 'var(--success)'
  const width = `${Math.min((score / 6) * 100, 100)}%`

  if (!password) return null

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character (!@#$)', met: /[!@#$%^&*]/.test(password) },
  ]

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Strength
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          height: '100%', width,
          background: color, borderRadius: 2, transition: 'all 0.3s',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
            <span style={{ color: c.met ? 'var(--success)' : 'rgba(255,255,255,0.2)', fontSize: 11 }}>
              {c.met ? '✓' : '○'}
            </span>
            <span style={{ color: c.met ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PwdInput({ label, field, form, setForm, showPwd, setShowPwd, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-mono)',
        color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.35)',
        fontSize: 9, fontWeight: 600,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        marginBottom: 8, transition: 'color 0.2s',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPwd[field] ? 'text' : 'password'}
          value={form[field]}
          onChange={e => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding: '12px 44px 12px 16px',
            color: 'var(--white)', fontSize: 14, outline: 'none',
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06)' : 'none',
          }}
        />
        <button type="button"
          onClick={() => setShowPwd(p => ({ ...p, [field]: !p[field] }))}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 15,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >{showPwd[field] ? '🙈' : '👁️'}</button>
      </div>
    </div>
  )
}

export default function ChangePasswordPage() {
  const [searchParams] = useSearchParams()
  const isRequired = searchParams.get('required') === 'true'
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState({ current_password: false, new_password: false, confirm_password: false })
  const { updateUser, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) { setError('New passwords do not match'); return }
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    try {
      await authAPI.changePassword({ current_password: form.current_password, new_password: form.new_password })
      if (user) updateUser({ ...user, must_change_password: false })
      setSuccess(true)
      setTimeout(() => {
        if (user?.role === 'institution') navigate('/institution')
        else if (user?.role === 'employer') navigate('/employer')
        else if (user?.role === 'admin') navigate('/admin')
        else navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Password change failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* bg grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 400,
        background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(6,11,20,0.96)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 24,
          padding: 'clamp(32px,5vw,48px) clamp(24px,5vw,40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.03)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold), var(--cyan))',
          }} />

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, background: 'var(--success)',
                borderRadius: 18, margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: 'white',
                boxShadow: '0 0 32px rgba(16,185,129,0.4)',
              }}>✓</div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)', fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em',
              }}>Password Changed!</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 52, height: 52,
                  background: isRequired ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.08)',
                  border: `1px solid ${isRequired ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.2)'}`,
                  borderRadius: 14, margin: '0 auto 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  boxShadow: isRequired ? '0 0 24px rgba(0,212,255,0.15)' : 'none',
                }}>🔐</div>

                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--cyan)', letterSpacing: '0.2em',
                  textTransform: 'uppercase', marginBottom: 8,
                }}>◈ Security ◈</div>

                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--white)', fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em',
                }}>
                  {isRequired ? 'Set Your Password' : 'Change Password'}
                </h1>

                {isRequired && (
                  <div style={{
                    background: 'rgba(0,212,255,0.06)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: 10, padding: '10px 14px', marginTop: 10,
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      color: 'rgba(0,212,255,0.8)', fontSize: 12, lineHeight: 1.6,
                    }}>
                      🔒 You must set a new password before continuing.
                      Your account was created with a temporary password.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10, padding: '10px 14px',
                  color: '#ff8a8a', fontSize: 13,
                  marginBottom: 20, display: 'flex',
                  alignItems: 'flex-start', gap: 8, animation: 'fadeIn 0.3s ease',
                }}>
                  <span style={{ flexShrink: 0 }}>⚠️</span>
                  <span style={{ flex: 1 }}>{error}</span>
                  <button onClick={() => setError('')} style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,138,138,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                  }}>✕</button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <PwdInput label="Current Password" field="current_password" form={form} setForm={setForm} showPwd={showPwd} setShowPwd={setShowPwd} placeholder="Your current password" />

                <PwdInput label="New Password" field="new_password" form={form} setForm={setForm} showPwd={showPwd} setShowPwd={setShowPwd} placeholder="Create a strong password" />
                <PasswordStrength password={form.new_password} />

                <div style={{ marginTop: 18 }}>
                  <PwdInput label="Confirm New Password" field="confirm_password" form={form} setForm={setForm} showPwd={showPwd} setShowPwd={setShowPwd} placeholder="Repeat new password" />
                  {form.confirm_password && form.new_password !== form.confirm_password && (
                    <p style={{ color: '#ff8a8a', fontSize: 11, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                      ✕ Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (form.confirm_password && form.new_password !== form.confirm_password)}
                  style={{
                    width: '100%', marginTop: 24,
                    background: loading ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                    color: loading ? 'rgba(255,255,255,0.4)' : '#000',
                    border: 'none', borderRadius: 10, padding: '13px',
                    fontSize: 14, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-display)',
                    boxShadow: loading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Changing...' : '🔐 Change Password'}
                </button>
              </form>

              {!isRequired && (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20 }}>
                  <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
                    ← Back to dashboard
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}