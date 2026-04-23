export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(2,6,14,0.98)',
      borderTop: '1px solid rgba(0,212,255,0.08)',
      padding: 'clamp(40px,6vw,64px) 24px clamp(24px,4vw,36px)',
      marginTop: 'auto',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, var(--cyan), var(--gold), var(--cyan), transparent)',
        opacity: 0.4,
      }} />

      {/* decorative bg glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 300,
        background: 'radial-gradient(ellipse, rgba(0,212,255,0.025) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(28px,4vw,48px)',
          marginBottom: 48,
        }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(201,148,58,0.15))',
                border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,212,255,0.1)',
              }}>
                <img
                  src="/assets/logoc.png"
                  alt="CertiFy"
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--white)', fontSize: 15, fontWeight: 700, lineHeight: 1.1,
                }}>
                  Certi<span style={{ color: 'var(--cyan)' }}>Fy</span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--gold)', fontSize: 8,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                }}>Sri Lanka</div>
              </div>
            </div>

            <p style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13, lineHeight: 1.75, maxWidth: 240,
              marginBottom: 20,
            }}>
              Sri Lanka's first AI-powered, blockchain-backed academic credential verification platform.
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: '🏛️', label: 'Institution' },
                { icon: '⛓️', label: 'Blockchain' },
                { icon: '🤖', label: 'AI' },
              ].map(({ icon, label }) => (
                <div key={label} title={label} style={{
                  width: 34, height: 34,
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid rgba(0,212,255,0.12)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, cursor: 'default',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,212,255,0.12)'
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,212,255,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)'
                  }}
                >{icon}</div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--cyan)', fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 600, marginBottom: 18,
            }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Verify Certificate', href: '/verify-public' },
                { label: 'Register Institution', href: '/register' },
                { label: 'Employer Portal', href: '/employer' },
                { label: 'Admin Panel', href: '/admin' },
                { label: 'Find Certificate', href: '/search' },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{
                  color: 'rgba(255,255,255,0.35)',
                  textDecoration: 'none', fontSize: 13,
                  transition: 'color 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >
                  <span style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: 'var(--cyan)', opacity: 0.5, flexShrink: 0,
                  }} />
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Technology */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--cyan)', fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 600, marginBottom: 18,
            }}>Technology</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { text: 'AI Fraud Detection (CNN)', color: 'var(--cyan)' },
                { text: 'Polygon Blockchain', color: 'var(--gold)' },
                { text: 'QR Code Verification', color: 'var(--cyan)' },
                { text: 'Smart OCR (EN + SI)', color: 'var(--gold)' },
                { text: 'Real-time Analytics', color: 'var(--cyan)' },
              ].map(({ text, color }) => (
                <span key={text} style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: color, flexShrink: 0,
                    boxShadow: `0 0 6px ${color}`,
                  }} />
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--cyan)', fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 600, marginBottom: 18,
            }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '🏢', text: 'Ministry of Education, Colombo 03' },
                { icon: '📧', text: 'verify@certverify.lk' },
                { icon: '📞', text: '+94 11 123 4567' },
                { icon: '🕒', text: 'Mon–Fri, 8:30 AM – 4:30 PM' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0, opacity: 0.7 }}>{icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px solid rgba(0,212,255,0.06)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.15)',
            fontSize: 10, letterSpacing: '0.05em',
          }}>
            © 2026 CertiFy Sri Lanka. All rights reserved.
          </p>

          {/* live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(16,185,129,0.6)',
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 8px var(--success)',
              animation: 'pulse-ring 2s infinite',
            }} />
            Blockchain Live
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
              <a key={link} href="#" style={{
                color: 'rgba(255,255,255,0.18)',
                textDecoration: 'none', fontSize: 11,
                transition: 'color 0.2s',
                fontFamily: 'var(--font-body)',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
              >{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}