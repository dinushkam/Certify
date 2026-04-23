import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { institutionRequestAPI } from '../../services/api'
import NotificationBell from './NotificationBell'

/* ─── tiny animated blockchain "nodes" beside logo ─── */
function ChainNodes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--cyan)',
          boxShadow: '0 0 6px var(--cyan)',
          animation: `pulse-ring 2s ${i * 0.4}s infinite`
        }} />
      ))}
    </div>
  )
}

/* ─── single nav link with active glow ─── */
function NavLink({ to, children, onClick, badge }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: isActive ? 'var(--cyan)' : 'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        fontFamily: 'var(--font-body)',
        padding: '8px 14px',
        borderRadius: 8,
        background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        letterSpacing: isActive ? '0.01em' : 0,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {/* active underline glow */}
      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: -1, left: '50%',
          transform: 'translateX(-50%)',
          width: '60%', height: 2,
          background: 'var(--cyan)',
          borderRadius: 2,
          boxShadow: '0 0 10px var(--cyan)',
          pointerEvents: 'none'
        }} />
      )}
      {children}
      {badge > 0 && (
        <span style={{
          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
          color: 'var(--navy)',
          borderRadius: 100,
          padding: '1px 6px',
          fontSize: 9,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>{badge}</span>
      )}
    </Link>
  )
}

/* ─── mobile nav link ─── */
function MobileNavLink({ to, icon, children, onClick, badge }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderRadius: 10,
        textDecoration: 'none',
        color: isActive ? 'var(--cyan)' : 'rgba(255,255,255,0.7)',
        background: isActive ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {badge > 0 && (
        <span style={{
          background: 'var(--gold)',
          color: 'var(--navy)',
          borderRadius: 100,
          padding: '1px 7px',
          fontSize: 9,
          fontWeight: 800,
        }}>{badge}</span>
      )}
      {isActive && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--cyan)',
          boxShadow: '0 0 6px var(--cyan)',
          flexShrink: 0,
        }} />
      )}
    </Link>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (user?.role === 'admin') {
      institutionRequestAPI.getPendingCount()
        .then(res => setPendingCount(res.data.count))
        .catch(() => {})
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const dashboardLink =
    user?.role === 'institution' ? '/institution' :
    user?.role === 'employer' ? '/employer' :
    user?.role === 'admin' ? '/admin' : '/'

  return (
    <>
      {/* ── NAV BAR ── */}
      <nav style={{
        background: scrolled
          ? 'rgba(2,8,16,0.95)'
          : 'rgba(2,8,16,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        transition: 'background 0.3s',
        boxShadow: scrolled
          ? '0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(0,212,255,0.08)'
          : 'none',
      }}>
        {/* scanning line at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, var(--cyan) 40%, var(--gold) 60%, transparent 100%)',
          opacity: 0.6,
        }} />

        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          gap: 16,
        }}>

          {/* ── LOGO ── */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'relative',
              width: 38, height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(201,148,58,0.15))',
              border: '1px solid rgba(0,212,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,212,255,0.15)',
            }}>
              <img
                src="/assets/logoc.png"
                alt="CertiFy"
                style={{
                  width: 28, height: 28,
                  filter: 'drop-shadow(0 2px 6px rgba(201,168,76,0.5))',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)',
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}>
                Certi<span style={{ color: 'var(--cyan)' }}>Fy</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--gold)',
                fontSize: 8,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}>Sri Lanka</div>
            </div>
            <ChainNodes />
          </Link>

          {/* ── DESKTOP LINKS ── */}
          <div className="desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
            justifyContent: 'center',
          }}>
            <NavLink to="/verify-public">Verify</NavLink>
            <NavLink to="/search">Find Cert</NavLink>

            {user && (
              <NavLink to={dashboardLink}>Dashboard</NavLink>
            )}

            {user && (user.role === 'admin' || user.role === 'institution') && (
              <NavLink to="/analytics">Analytics</NavLink>
            )}

            {user?.role === 'admin' && (
              <NavLink to="/admin/requests" badge={pendingCount}>Requests</NavLink>
            )}
          </div>

          {/* ── DESKTOP RIGHT ── */}
          <div className="desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}>
            {user ? (
              <>
                <NotificationBell />

                {/* user pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 10px 5px 5px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                }}>
                  <div style={{
                    width: 28, height: 28,
                    background: 'linear-gradient(135deg, var(--cyan), var(--gold))',
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: '#000',
                    flexShrink: 0,
                    fontFamily: 'var(--font-display)',
                  }}>
                    {user.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      color: '#fff', fontSize: 12, fontWeight: 500, lineHeight: 1.1,
                      maxWidth: 100, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user.full_name?.split(' ')[0]}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--cyan)',
                      fontSize: 8, letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      {user.role}
                    </div>
                  </div>
                </div>

                <Link
                  to="/change-password"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.5)',
                    textDecoration: 'none', fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                  title="Change Password"
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
                    e.currentTarget.style.color = 'var(--cyan)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                  }}
                >
                  🔐
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: 'rgba(239,68,68,0.7)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                    e.currentTarget.style.color = '#ef4444'
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(239,68,68,0.7)'
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                    color: '#000',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '7px 16px',
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,212,255,0.35)',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,212,255,0.55)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,212,255,0.35)'}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ── MOBILE HAMBURGER ── */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              background: menuOpen ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${menuOpen ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: menuOpen ? 'var(--cyan)' : 'rgba(255,255,255,0.7)',
              width: 38, height: 38,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            {menuOpen ? (
              /* X icon */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Hamburger */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── MOBILE DROPDOWN ── */}
      {menuOpen && (
        <div style={{
          background: 'rgba(2,8,16,0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,212,255,0.12)',
          padding: '12px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: 'sticky',
          top: 60,
          zIndex: 199,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          animation: 'slide-down 0.2s ease',
        }}>
          {/* user info bar */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: 10,
              marginBottom: 4,
            }}>
              <div style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, var(--cyan), var(--gold))',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#000',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}>
                {user.full_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.full_name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan)', fontSize: 9,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  {user.role} · Active
                </div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 8px var(--success)',
                flexShrink: 0,
              }} />
            </div>
          )}

          {/* links */}
          <MobileNavLink to="/verify-public" icon="🔍" onClick={() => setMenuOpen(false)}>
            Verify Certificate
          </MobileNavLink>
          <MobileNavLink to="/search" icon="📄" onClick={() => setMenuOpen(false)}>
            Find Certificate
          </MobileNavLink>

          {user && (
            <MobileNavLink to={dashboardLink} icon="📊" onClick={() => setMenuOpen(false)}>
              Dashboard
            </MobileNavLink>
          )}

          {user && (user.role === 'admin' || user.role === 'institution') && (
            <MobileNavLink to="/analytics" icon="📈" onClick={() => setMenuOpen(false)}>
              Analytics
            </MobileNavLink>
          )}

          {user?.role === 'admin' && (
            <MobileNavLink to="/admin/requests" icon="📋" badge={pendingCount} onClick={() => setMenuOpen(false)}>
              Requests
            </MobileNavLink>
          )}

          {user && (
            <MobileNavLink to="/change-password" icon="🔐" onClick={() => setMenuOpen(false)}>
              Change Password
            </MobileNavLink>
          )}

          {/* divider */}
          <div style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            margin: '4px 0',
          }} />

          {user ? (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                color: '#ef4444',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
            >
              <span style={{ fontSize: 15 }}>🚪</span>
              Sign Out
            </button>
          ) : (
            <>
              <MobileNavLink to="/login" icon="👤" onClick={() => setMenuOpen(false)}>
                Sign In
              </MobileNavLink>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, var(--cyan), rgba(0,180,220,1))',
                  borderRadius: 10,
                  color: '#000',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
                }}
              >
                ✦ Register Now
              </Link>
            </>
          )}
        </div>
      )}
    </>
  )
}