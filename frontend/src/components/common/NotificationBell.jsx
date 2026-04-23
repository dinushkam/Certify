import { useState, useEffect, useRef } from 'react'
import { notificationAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const TYPE_STYLES = {
  success: { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)', icon: '✅' },
  warning: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)', icon: '⚠️' },
  danger:  { bg: 'rgba(239,68,68,0.1)',  color: 'var(--danger)',  border: 'rgba(239,68,68,0.2)',  icon: '❌' },
  info:    { bg: 'rgba(0,212,255,0.06)', color: 'var(--cyan)',    border: 'rgba(0,212,255,0.15)', icon: 'ℹ️' },
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getAll(false, 15)
      setNotifications(res.data.notifications)
      setUnread(res.data.unread_count)
    } catch {}
  }

  const handleMarkRead = async (id, link) => {
    await notificationAPI.markRead(id)
    loadNotifications()
    if (link) { setOpen(false); navigate(link) }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    await notificationAPI.markAllRead()
    loadNotifications()
    setLoading(false)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await notificationAPI.delete(id)
    loadNotifications()
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          background: open ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8, width: 36, height: 36,
          cursor: 'pointer', fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', color: open ? 'var(--cyan)' : 'rgba(255,255,255,0.6)',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(0,212,255,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--danger)',
            color: 'white', borderRadius: '50%',
            width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800,
            border: '2px solid var(--navy)',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 0 8px rgba(239,68,68,0.5)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 340, maxHeight: 480,
          background: 'rgba(4,9,18,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.04)',
          zIndex: 1000, overflow: 'hidden',
          animation: 'fadeIn 0.18s ease',
        }}>
          {/* top gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, var(--cyan), var(--gold), var(--cyan))',
            opacity: 0.6,
          }} />

          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(0,212,255,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--white)', fontSize: 13, fontWeight: 600,
              }}>Notifications</p>
              {unread > 0 && (
                <span style={{
                  background: 'var(--danger)',
                  color: 'white', borderRadius: 100,
                  padding: '1px 7px', fontSize: 9, fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                }}>{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--cyan)', fontSize: 10,
                  fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  opacity: loading ? 0.4 : 0.8,
                  transition: 'opacity 0.2s',
                }}
              >Mark all read</button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 390, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>🔔</div>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255,255,255,0.25)', fontSize: 11,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map(n => {
                const s = TYPE_STYLES[n.type] || TYPE_STYLES.info
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.link)}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '11px 14px',
                      borderBottom: '1px solid rgba(0,212,255,0.05)',
                      cursor: n.link ? 'pointer' : 'default',
                      background: n.is_read ? 'transparent' : 'rgba(0,212,255,0.02)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(0,212,255,0.02)'}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: s.bg, flexShrink: 0,
                      border: `1px solid ${s.border}`,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 13,
                    }}>{s.icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, fontWeight: n.is_read ? 400 : 600,
                        color: n.is_read ? 'rgba(255,255,255,0.6)' : 'var(--white)',
                        marginBottom: 2, lineHeight: 1.4,
                      }}>{n.title}</p>
                      <p style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.3)',
                        lineHeight: 1.5,
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>{n.message}</p>
                      <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9, color: 'rgba(0,212,255,0.4)',
                        marginTop: 3, letterSpacing: '0.05em',
                      }}>{timeAgo(n.created_at)}</p>
                    </div>

                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      gap: 4, alignItems: 'center', flexShrink: 0,
                    }}>
                      {!n.is_read && (
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'var(--cyan)',
                          boxShadow: '0 0 6px var(--cyan)',
                        }} />
                      )}
                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'rgba(255,255,255,0.2)',
                          cursor: 'pointer', fontSize: 11, lineHeight: 1,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                      >✕</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}