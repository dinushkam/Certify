import { Link } from 'react-router-dom'
import Footer from '../components/common/Footer'
import heroImage from '../assets/hero-certificate-scene.png'

const features = [
  { icon: '🤖', title: 'AI Fraud Detection', desc: 'CNN deep learning model trained on thousands of certificates detects forgery with high accuracy.', accent: 'var(--cyan)' },
  { icon: '⛓️', title: 'Blockchain Secured', desc: 'Every certificate hash permanently stored on Polygon blockchain — immutable and tamper-proof.', accent: 'var(--gold)' },
  { icon: '📱', title: 'QR Verification', desc: 'Instant verification by scanning a QR code. Works on any device, anywhere in Sri Lanka.', accent: 'var(--cyan)' },
  { icon: '🔍', title: 'Smart OCR', desc: 'Automatic text extraction from certificates in both English and Sinhala languages.', accent: 'var(--gold)' },
  { icon: '📊', title: 'Analytics', desc: 'Real-time fraud trends, verification statistics, and predictive risk analytics dashboard.', accent: 'var(--cyan)' },
  { icon: '🏛️', title: 'Institution Ready', desc: 'Purpose-built for Sri Lankan universities, schools, and professional bodies.', accent: 'var(--gold)' },
]

const stats = [
  { value: '100%', label: 'Tamper Proof', icon: '🛡️' },
  { value: 'AI', label: 'Powered Detection', icon: '🤖' },
  { value: '24/7', label: 'Instant Verify', icon: '⚡' },
  { value: 'LKA', label: 'Built for Sri Lanka', icon: '🇱🇰' },
]

/* Floating blockchain node visual */
function BlockNode({ x, y, size = 6, delay = 0, color = 'var(--cyan)' }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animation: `pulse-ring 3s ${delay}s infinite`,
      pointerEvents: 'none',
    }} />
  )
}

/* Animated hex ring */
function HexRing({ size, x, y, speed = 25, opacity = 0.04, color = 'var(--cyan)' }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: size, height: size,
      border: `1px solid ${color}`,
      borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
      opacity,
      animation: `hex-rotate ${speed}s linear infinite`,
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
    }} />
  )
}

export default function HomePage() {
  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <section style={{
        background: 'var(--navy)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
      }}>
        {/* decorative bg nodes */}
        <BlockNode x={8}  y={15} size={5}  delay={0}   color="var(--cyan)" />
        <BlockNode x={92} y={20} size={4}  delay={0.8} color="var(--gold)" />
        <BlockNode x={15} y={70} size={6}  delay={1.6} color="var(--cyan)" />
        <BlockNode x={85} y={65} size={5}  delay={0.4} color="var(--cyan)" />
        <BlockNode x={50} y={88} size={4}  delay={1.2} color="var(--gold)" />
        <HexRing size={600} x={90} y={10}  speed={35} opacity={0.04} color="var(--cyan)" />
        <HexRing size={400} x={5}  y={85}  speed={20} opacity={0.04} color="var(--gold)" />
        <HexRing size={300} x={50} y={50}  speed={50} opacity={0.02} color="var(--cyan)" />

        {/* hero image */}
        <div style={{
          position: 'relative',
          width: '100%',
          flex: '1 1 auto',
          minHeight: '65vh',
        }}>
          <img
            src={heroImage}
            alt="Verify Academic Credentials"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 1,
              opacity: 0.55,
            }}
          />
          {/* gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(28, 121, 234, 0.5) 0%, rgba(24, 53, 82, 0.3) 30%, rgba(32, 48, 70, 0.85) 70%, #020810 100%)',
            zIndex: 2,
          }} />
          {/* scan line animation */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
            zIndex: 3,
            animation: 'scan 4s linear infinite',
            opacity: 0.6,
          }} />
        </div>

        {/* hero text */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px 80px',
          textAlign: 'center',
        }}>
          {/* chain badge */}
          <div className="animate-fade-up delay-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <span className="chain-badge">
              Powered by Polygon Blockchain
            </span>
          </div>

          <h1 className="animate-fade-up delay-2" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--white)',
            fontSize: 'clamp(36px, 7vw, 76px)',
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 20,
            letterSpacing: '-0.03em',
          }}>
            Verify Academic<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--cyan) 0%, var(--gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Credentials
            </span>
            {' '}with Confidence
          </h1>

          <p className="animate-fade-up delay-3" style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 'clamp(15px, 2.5vw, 19px)',
            lineHeight: 1.7,
            maxWidth: 660,
            margin: '0 auto 48px',
          }}>
            Sri Lanka's first AI-powered, blockchain-backed certificate verification system.
            Eliminate fraud. Build institutional trust.
          </p>

          <div className="animate-fade-up delay-4" style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link to="/verify-public" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
              color: '#000',
              textDecoration: 'none',
              padding: '15px 36px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 8px 32px rgba(0,212,255,0.45)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,212,255,0.65)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,212,255,0.45)'}
            >
              ⚡ VERIFY NOW
            </Link>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent',
              color: 'var(--white)',
              textDecoration: 'none',
              padding: '15px 36px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              border: '1px solid rgba(255,255,255,0.2)',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'
                e.currentTarget.style.color = 'var(--cyan)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.color = 'var(--white)'
              }}
            >
              REGISTER NOW →
            </Link>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="hero-stats" style={{
          maxWidth: 900,
          margin: '-40px auto 0',
          background: 'rgba(9,14,26,0.9)',
          borderRadius: 16,
          border: '1px solid rgba(0,212,255,0.12)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.05)',
          position: 'relative',
          zIndex: 5,
        }}>
          {stats.map((s, i) => (
            <div key={i} className={`animate-fade-up delay-${i + 4}`} style={{
              padding: '22px 16px',
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(0,212,255,0.08)' : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)',
                fontSize: 'clamp(16px, 3vw, 24px)',
                fontWeight: 600,
                marginBottom: 4,
                letterSpacing: '0.05em',
              }}>{s.value}</div>
              <div style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          HOW IT WORKS
      ══════════════════════════════ */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p className="section-label">How It Works</p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 4vw, 42px)',
            color: 'var(--white)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}>Three Steps to Verified</h2>
        </div>

        <div className="how-grid">
          {[
            {
              step: '01', title: 'Institution Uploads',
              desc: 'Accredited institutions upload certificate files. Our AI extracts text and validates authenticity automatically.',
              icon: '🏛️', color: 'var(--cyan)',
            },
            {
              step: '02', title: 'Blockchain Registration',
              desc: 'A unique cryptographic hash is generated and permanently stored on the Polygon blockchain network.',
              icon: '⛓️', color: 'var(--gold)',
            },
            {
              step: '03', title: 'Instant Verification',
              desc: 'Employers scan a QR code or enter a certificate ID to get instant, tamper-proof verification results.',
              icon: '✅', color: 'var(--cyan)',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(9,14,26,0.8)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 20,
              padding: 'clamp(24px,3vw,40px)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = `0 24px 60px rgba(0,0,0,0.6), 0 0 40px ${item.color}10`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* top gradient line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                opacity: 0.6,
              }} />
              {/* step number background */}
              <div style={{
                position: 'absolute', top: 20, right: 20,
                fontFamily: 'var(--font-mono)',
                color: 'rgba(0,212,255,0.06)',
                fontSize: 72, fontWeight: 700, lineHeight: 1,
                userSelect: 'none',
              }}>{item.step}</div>

              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `rgba(0,212,255,0.08)`,
                border: `1px solid ${item.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 20,
              }}>{item.icon}</div>

              <div style={{
                fontFamily: 'var(--font-mono)',
                color: item.color,
                fontSize: 10, letterSpacing: '0.15em',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>Step {item.step}</div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)',
                fontSize: 'clamp(16px,2vw,20px)',
                fontWeight: 600,
                marginBottom: 12,
              }}>{item.title}</h3>

              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 14,
                lineHeight: 1.75,
              }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES GRID
      ══════════════════════════════ */}
      <section style={{
        background: 'rgba(5,12,20,0.8)',
        borderTop: '1px solid rgba(0,212,255,0.06)',
        borderBottom: '1px solid rgba(0,212,255,0.06)',
        padding: 'clamp(60px,8vw,100px) 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative hex rings */}
        <HexRing size={700} x={100} y={50} speed={40} opacity={0.03} color="var(--cyan)" />
        <HexRing size={500} x={0}   y={50} speed={30} opacity={0.03} color="var(--gold)" />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="section-label">Platform Features</p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 42px)',
              color: 'var(--white)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>Built for Sri Lanka</h2>
          </div>

          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(9,14,26,0.7)',
                border: '1px solid rgba(0,212,255,0.08)',
                borderRadius: 16,
                padding: 'clamp(20px,2.5vw,32px)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.05)'
                  e.currentTarget.style.borderColor = `${f.accent}40`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 20px ${f.accent}08`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(9,14,26,0.7)'
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: 'clamp(20px,2.5vw,28px)', marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{
                  color: 'var(--white)',
                  fontSize: 'clamp(13px,1.5vw,16px)',
                  fontWeight: 600,
                  marginBottom: 8,
                  fontFamily: 'var(--font-display)',
                }}>{f.title}</h3>
                <p style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                  lineHeight: 1.75,
                }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CTA SECTION
      ══════════════════════════════ */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center', position: 'relative' }}>
        <BlockNode x={10} y={20} size={5} delay={0}   color="var(--cyan)" />
        <BlockNode x={90} y={80} size={4} delay={1.5} color="var(--gold)" />

        <div style={{
          maxWidth: 620, margin: '0 auto',
          background: 'rgba(9,14,26,0.9)',
          borderRadius: 24,
          border: '1px solid rgba(0,212,255,0.15)',
          padding: 'clamp(32px,5vw,60px) clamp(24px,4vw,48px)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,212,255,0.04)',
        }}>
          {/* top line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold), var(--cyan))',
          }} />
          {/* corner decorations */}
          <div style={{
            position: 'absolute', top: 20, left: 20,
            width: 40, height: 40,
            borderTop: '1px solid rgba(0,212,255,0.3)',
            borderLeft: '1px solid rgba(0,212,255,0.3)',
            borderRadius: '4px 0 0 0',
          }} />
          <div style={{
            position: 'absolute', bottom: 20, right: 20,
            width: 40, height: 40,
            borderBottom: '1px solid rgba(201,148,58,0.3)',
            borderRight: '1px solid rgba(201,148,58,0.3)',
            borderRadius: '0 0 4px 0',
          }} />

          <div style={{ fontSize: 36, marginBottom: 16 }}>⛓️</div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--white)',
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 700,
            marginBottom: 14,
            letterSpacing: '-0.02em',
          }}>Ready to Get Started?</h2>

          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 15,
            lineHeight: 1.75,
            marginBottom: 36,
          }}>
            Join Sri Lanka's trusted credential verification network.
            Free for educational institutions.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
              color: '#000',
              textDecoration: 'none',
              padding: '12px 28px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              fontFamily: 'var(--font-display)',
              boxShadow: '0 6px 24px rgba(0,212,255,0.35)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,212,255,0.55)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,212,255,0.35)'}
            >
              Register Now
            </Link>
            <Link to="/verify-public" style={{
              background: 'rgba(201,148,58,0.1)',
              color: 'var(--gold)',
              textDecoration: 'none',
              padding: '12px 28px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid rgba(201,148,58,0.25)',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(201,148,58,0.18)'
                e.currentTarget.style.borderColor = 'rgba(201,148,58,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(201,148,58,0.1)'
                e.currentTarget.style.borderColor = 'rgba(201,148,58,0.25)'
              }}
            >
              Verify Certificate
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}