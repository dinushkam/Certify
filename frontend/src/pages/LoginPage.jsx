import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function BlockchainBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {/* glow orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(201,148,58,0.05) 0%, transparent 65%)',
        borderRadius: '50%',
      }} />
      {/* floating nodes */}
      {[
        { x: '5%',  y: '20%', c: 'var(--cyan)',  d: 0    },
        { x: '90%', y: '15%', c: 'var(--gold)',  d: 0.8  },
        { x: '10%', y: '80%', c: 'var(--cyan)',  d: 1.4  },
        { x: '88%', y: '75%', c: 'var(--cyan)',  d: 0.4  },
        { x: '50%', y: '5%',  c: 'var(--gold)',  d: 1.0  },
      ].map((n, i) => (
        <div key={i} style={{
          position: 'absolute', left: n.x, top: n.y,
          width: 5, height: 5, borderRadius: '50%',
          background: n.c,
          boxShadow: `0 0 10px ${n.c}`,
          animation: `pulse-ring 3s ${n.d}s infinite`,
        }} />
      ))}
      {/* corner brackets */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        width: 48, height: 48,
        borderTop: '1px solid rgba(0,212,255,0.2)',
        borderLeft: '1px solid rgba(0,212,255,0.2)',
        borderRadius: '4px 0 0 0',
      }} />
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        width: 48, height: 48,
        borderBottom: '1px solid rgba(201,148,58,0.2)',
        borderRight: '1px solid rgba(201,148,58,0.2)',
        borderRadius: '0 0 4px 0',
      }} />
    </div>
  )
}

function InputField({ label, type = 'text', value, onChange, placeholder, required, extra }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-mono)',
        color: focused ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
        fontSize: 9, fontWeight: 600,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        marginBottom: 8,
        transition: 'color 0.2s',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: focused ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding: '12px 16px',
            color: 'var(--white)', fontSize: 14,
            outline: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.08)' : 'none',
          }}
        />
        {extra}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', remember_me: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login(form)
      const { access_token, refresh_token, user: userData } = res.data
      login(access_token, refresh_token, userData, form.remember_me)
      if (userData.must_change_password) { navigate('/change-password?required=true'); return }
      const role = userData.role
      if (role === 'institution') navigate('/institution')
      else if (role === 'employer') navigate('/employer')
      else if (role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <BlockchainBg />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* card */}
        <div style={{
          background: 'rgba(6,11,20,0.95)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 24,
          padding: 'clamp(32px,5vw,48px) clamp(24px,5vw,40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.04)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* top gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold), var(--cyan))',
          }} />

          {/* logo + heading */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(201,148,58,0.15))',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 16,
              margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0,212,255,0.15)',
            }}>
              <img src="/assets/logoc.png" alt="CertiFy" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9, color: 'var(--cyan)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              ◈ Secure Access Portal ◈
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--white)',
              fontSize: 26, fontWeight: 700, marginBottom: 6,
              letterSpacing: '-0.02em',
            }}>Welcome Back</h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Sign in to CertiFy Sri Lanka
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 8,
              marginBottom: 20, animation: 'fadeIn 0.3s ease',
            }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>⚠️</span>
              <span style={{ color: '#ff8a8a', fontSize: 13, flex: 1 }}>{error}</span>
              <button onClick={() => setError('')} style={{
                background: 'none', border: 'none',
                color: 'rgba(255,138,138,0.4)', cursor: 'pointer',
                fontSize: 16, flexShrink: 0, lineHeight: 1,
              }}>✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <InputField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@institution.lk"
              required
            />

            {/* password with toggle */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                marginBottom: 8,
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '12px 44px 12px 16px',
                    color: 'var(--white)', fontSize: 14,
                    outline: 'none', fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s',
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: 15,
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {/* remember + forgot */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.remember_me}
                  onChange={e => setForm({ ...form, remember_me: e.target.checked })}
                  style={{ accentColor: 'var(--cyan)', width: 14, height: 14 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Stay signed in</span>
              </label>
              <Link to="/forgot-password" style={{
                color: 'var(--cyan)', fontSize: 12,
                textDecoration: 'none', fontWeight: 500,
                opacity: 0.8, transition: 'opacity 0.2s',
              }}>Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading
                  ? 'rgba(0,212,255,0.2)'
                  : 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                color: loading ? 'rgba(255,255,255,0.4)' : '#000',
                border: 'none', borderRadius: 10,
                padding: '13px',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                boxShadow: loading ? 'none' : '0 6px 24px rgba(0,212,255,0.35)',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,212,255,0.55)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,212,255,0.35)' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'var(--cyan)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  Authenticating...
                </span>
              ) : '⚡ Sign In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 13, marginTop: 24,
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: 'var(--cyan)', textDecoration: 'none',
              fontWeight: 600, opacity: 0.9,
            }}>Register here</Link>
          </p>
        </div>

        {/* bottom note */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.15)',
          fontSize: 10, marginTop: 20,
          letterSpacing: '0.08em',
        }}>
          🔒 256-bit SSL · Polygon Blockchain Secured
        </p>
      </div>
    </div>
  )
}