import { useState, useEffect } from 'react'

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: { bg: 'rgba(26,107,60,0.95)', border: 'rgba(26,107,60,0.6)', icon: '✓' },
    error: { bg: 'rgba(139,26,26,0.95)', border: 'rgba(139,26,26,0.6)', icon: '✕' },
    info: { bg: 'rgba(11,31,58,0.95)', border: 'rgba(201,168,76,0.4)', icon: 'ℹ' },
  }

  const c = colors[type]

  return (
    <div style={{
      position: 'fixed', top: 80, right: 24,
      zIndex: 9999,
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: 360, minWidth: 280,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        color: 'white', fontSize: 14,
        fontWeight: 700, flexShrink: 0
      }}>{c.icon}</div>
      <p style={{
        color: 'white', fontSize: 13,
        lineHeight: 1.5, flex: 1, margin: 0
      }}>{message}</p>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontSize: 16,
          flexShrink: 0, padding: 0
        }}
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
      zIndex: 9999, display: 'flex',
      flexDirection: 'column', gap: 10
    }}>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  )

  return { show, ToastContainer }
}