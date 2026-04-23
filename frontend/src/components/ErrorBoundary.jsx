import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--navy)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 40px',
            textAlign: 'center',
            maxWidth: 480, width: '100%'
          }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--white)', fontSize: 24,
              fontWeight: 700, marginBottom: 10
            }}>Something Went Wrong</h2>
            <p style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14, lineHeight: 1.6, marginBottom: 28
            }}>
              An unexpected error occurred. Please refresh the page or contact support if the problem continues.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  color: 'var(--navy)', border: 'none',
                  borderRadius: 8, padding: '10px 24px',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}
              >🔄 Refresh Page</button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.history.back()
                }}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, padding: '10px 24px',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}
              >← Go Back</button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                marginTop: 24, padding: '12px 16px',
                background: 'rgba(139,26,26,0.2)',
                border: '1px solid rgba(139,26,26,0.3)',
                borderRadius: 8, textAlign: 'left'
              }}>
                <p style={{
                  color: '#ff8a8a', fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.6, wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}