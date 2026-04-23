// ─── ProgressBar.jsx ─────────────────────────────────────────────────────────
export default function ProgressBar({ current, total, label = 'Processing...' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div style={{
      background: 'rgba(245,158,11,0.06)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 14, padding: '16px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* scanning shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)',
      }} />

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--warning)', fontSize: 13, fontWeight: 600,
        }}>{label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--warning)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.06em',
        }}>{current}/{total} <span style={{ opacity: 0.6 }}>({pct}%)</span></span>
      </div>

      {/* track */}
      <div style={{
        height: 6, background: 'rgba(245,158,11,0.1)',
        borderRadius: 3, overflow: 'hidden',
        border: '1px solid rgba(245,158,11,0.12)',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
          borderRadius: 3,
          transition: 'width 0.4s ease',
          boxShadow: `0 0 10px rgba(201,148,58,${pct > 0 ? 0.5 : 0})`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }} />
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(245,158,11,0.5)',
        fontSize: 9, marginTop: 8, textAlign: 'center',
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        ⏳ Please wait — do not close this page
      </p>
    </div>
  )
}


// ─── Toast.jsx ───────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [])

  const styles = {
    success: {
      bg: 'rgba(4,9,18,0.97)',
      border: 'rgba(16,185,129,0.3)',
      accent: '#34d399',
      icon: '✓',
      glow: 'rgba(16,185,129,0.15)',
    },
    error: {
      bg: 'rgba(4,9,18,0.97)',
      border: 'rgba(239,68,68,0.3)',
      accent: '#f87171',
      icon: '✕',
      glow: 'rgba(239,68,68,0.15)',
    },
    info: {
      bg: 'rgba(4,9,18,0.97)',
      border: 'rgba(0,212,255,0.3)',
      accent: 'var(--cyan)',
      icon: 'ℹ',
      glow: 'rgba(0,212,255,0.1)',
    },
  }

  const s = styles[type] || styles.info

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 12, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${s.glow}`,
      maxWidth: 360, minWidth: 280,
      animation: 'fadeIn 0.25s ease',
      backdropFilter: 'blur(20px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: s.accent,
        boxShadow: `0 0 8px ${s.accent}`,
      }} />

      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${s.accent}15`,
        border: `1px solid ${s.accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: s.accent, fontSize: 13,
        fontWeight: 700, flexShrink: 0,
      }}>{s.icon}</div>

      <p style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13, lineHeight: 1.5, flex: 1, margin: 0,
      }}>{message}</p>

      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.2)',
          cursor: 'pointer', fontSize: 14,
          flexShrink: 0, padding: 0,
          transition: 'color 0.2s', lineHeight: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
      >✕</button>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const ToastContainer = () => (
    <div style={{
      position: 'fixed', top: 80, right: 24,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <Toast message={t.message} type={t.type} onClose={() => remove(t.id)} />
        </div>
      ))}
    </div>
  )

  return { show, ToastContainer }
}