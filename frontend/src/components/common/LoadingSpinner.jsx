// ─── LoadingSpinner.jsx ────────────────────────────────────────────────────
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(40px,6vw,72px) 24px', gap: 16,
    }}>
      {/* triple ring spinner */}
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid rgba(0,212,255,0.08)',
          borderTopColor: 'var(--cyan)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8,
          border: '2px solid rgba(201,148,58,0.08)',
          borderTopColor: 'var(--gold)',
          borderRadius: '50%',
          animation: 'spin 1.4s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 16,
          width: 16, height: 16,
          background: 'rgba(0,212,255,0.2)',
          borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.4)',
        }} />
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10, letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>{message}</p>
    </div>
  )
}

export default LoadingSpinner