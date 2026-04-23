// ─── StatusBadge.jsx ─────────────────────────────────────────────────────────
export default function StatusBadge({ isValid, isRevoked, size = 'sm' }) {
  const pad = size === 'lg' ? '7px 18px' : '3px 10px'
  const fs  = size === 'lg' ? 12 : 9

  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: pad, borderRadius: 100,
    fontSize: fs, fontWeight: 700,
    letterSpacing: '0.1em',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
  }

  if (isRevoked) return (
    <span style={{
      ...base,
      background: 'rgba(239,68,68,0.1)',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.25)',
      boxShadow: '0 0 8px rgba(239,68,68,0.1)',
    }}>
      <span style={{
        width: 4, height: 4, borderRadius: '50%',
        background: '#f87171',
        boxShadow: '0 0 4px #f87171',
      }} />
      REVOKED
    </span>
  )

  if (isValid) return (
    <span style={{
      ...base,
      background: 'rgba(16,185,129,0.1)',
      color: '#34d399',
      border: '1px solid rgba(16,185,129,0.25)',
      boxShadow: '0 0 8px rgba(16,185,129,0.1)',
    }}>
      <span style={{
        width: 4, height: 4, borderRadius: '50%',
        background: '#34d399',
        boxShadow: '0 0 4px #34d399',
        animation: 'pulse-ring 2s infinite',
      }} />
      VALID
    </span>
  )

  return (
    <span style={{
      ...base,
      background: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{
        width: 4, height: 4, borderRadius: '50%',
        background: 'rgba(255,255,255,0.3)',
      }} />
      INVALID
    </span>
  )
}