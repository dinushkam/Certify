import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../common/Toast'
import { certificateAPI } from '../../services/api'

// ── Templates ─────────────────────────────────────────────
const TEMPLATES = [
  { id: 'navy',     name: 'Classic Navy',  bg: '#0B1F3A', accent: '#C9943A', text: '#FFFFFF' },
  { id: 'space',    name: 'Deep Space',    bg: '#050C18', accent: '#00D4FF', text: '#FFFFFF' },
  { id: 'green',    name: 'Academic',      bg: '#0D2818', accent: '#4ade80', text: '#FFFFFF' },
  { id: 'prestige', name: 'Prestige',      bg: '#1A040D', accent: '#E8C96D', text: '#FFFFFF' },
  { id: 'white',    name: 'Professional',  bg: '#FFFFFF', accent: '#0B1F3A', text: '#0B1F3A' },
  { id: 'slate',    name: 'Slate',         bg: '#1E293B', accent: '#818CF8', text: '#FFFFFF' },
]

// ── Helpers ───────────────────────────────────────────────
const Label = ({ children }) => (
  <p style={{
    fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
  }}>{children}</p>
)

const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9, padding: '10px 13px',
  color: '#fff', fontSize: 13,
  fontFamily: 'var(--font-body)', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  ...extra,
})

const focusIn  = e => { e.target.style.borderColor = 'rgba(0,212,255,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.07)' }
const focusOut = e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }

// Safe hex → rgba  (guards against undefined/null hex values)
const hexRgba = (hex, a = 1) => {
  if (!hex || typeof hex !== 'string' || hex.length < 7) return `rgba(255,255,255,${a})`
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,255,255,${a})`
    return `rgba(${r},${g},${b},${a})`
  } catch {
    return `rgba(255,255,255,${a})`
  }
}

export default function TemplateDesigner() {
  const { user }  = useAuth()
  const { show, ToastContainer } = useToast()
  const canvasRef = useRef(null)

  const [tmpl, setTmpl]         = useState(TEMPLATES[0])
  const [logo, setLogo]         = useState(null)
  const [tab, setTab]           = useState('single')
  const [issuing, setIssuing]   = useState(false)
  const [batchIdx, setBatchIdx] = useState(-1)
  const [batchResults, setBatchResults] = useState(null)
  const [preview, setPreview]   = useState('')

  const [single, setSingle] = useState({
    holder_name:     '',
    holder_email:    '',
    course_name:     '',
    issue_date:      new Date().toISOString().split('T')[0],
    expiry_date:     '',
    signatory_name:  'Director / Principal',
    signatory_title: 'Authorized Signatory',
    tagline:         'This is to certify that',
  })

  const [students, setStudents]       = useState([{ id: 1, holder_name: '', holder_email: '', expiry_date: '' }])
  const [batchCourse, setBatchCourse] = useState('')
  const [batchDate,   setBatchDate]   = useState(new Date().toISOString().split('T')[0])

  // ── canvas draw ────────────────────────────────────────
  // FIX: wrap draw in useCallback so all dependencies are captured correctly
  // and the function reference stays stable across renders.
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 800
    const H = 560
    canvas.width  = W
    canvas.height = H

    const t = tmpl

    // FIX: always fall back to '#FFFFFF' if text is undefined
    const textColor = (t && t.text) ? t.text : '#FFFFFF'
    const accent    = (t && t.accent) ? t.accent : '#C9943A'
    const bg        = (t && t.bg)     ? t.bg     : '#0B1F3A'

    const name   = preview || (tab === 'single' ? single.holder_name : '') || 'Recipient Name'
    const course = (tab === 'single' ? single.course_name : batchCourse) || 'Course / Qualification'
    const date   = (tab === 'single' ? single.issue_date  : batchDate)   || '—'
    const inst   = (user && user.full_name) ? user.full_name : 'Institution Name'

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Outer border
    ctx.strokeStyle = accent
    ctx.lineWidth = 3
    ctx.strokeRect(16, 16, W - 32, H - 32)

    // Inner border
    ctx.lineWidth = 1
    ctx.strokeRect(24, 24, W - 48, H - 48)

    // Corner dots
    ;[[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([x, y]) => {
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    })

    // Accent bars
    ctx.fillStyle = accent
    ctx.fillRect(40, 40, W - 80, 4)
    ctx.fillRect(40, H - 44, W - 80, 4)

    // helper: text colour at opacity
    const tc = (alpha) => hexRgba(textColor, alpha)

    const renderText = () => {
      ctx.textAlign = 'center'

      // Institution Name
      ctx.fillStyle = accent
      ctx.font = 'bold 17px Georgia,serif'
      ctx.fillText(inst.toUpperCase(), W / 2, 148)

      // Tagline
      ctx.fillStyle = tc(0.5)
      ctx.font = '13px Georgia,serif'
      ctx.fillText(single.tagline || 'This is to certify that', W / 2, 184)

      // Recipient Name
      ctx.fillStyle = textColor
      ctx.font = 'bold 30px Georgia,serif'
      ctx.fillText(name, W / 2, 226)

      // Underline beneath name
      const nw = ctx.measureText(name).width
      ctx.strokeStyle = accent
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(W / 2 - nw / 2 - 20, 236)
      ctx.lineTo(W / 2 + nw / 2 + 20, 236)
      ctx.stroke()

      // "has successfully completed"
      ctx.fillStyle = tc(0.6)
      ctx.font = '13px Georgia,serif'
      ctx.fillText('has successfully completed', W / 2, 264)

      // Course
      ctx.fillStyle = accent
      ctx.font = 'bold 19px Georgia,serif'
      ctx.fillText(course, W / 2, 296)

      // Issue Date
      ctx.fillStyle = tc(0.5)
      ctx.font = '12px Georgia,serif'
      ctx.fillText(`Issued on ${date}`, W / 2, 326)

      // Divider
      ctx.strokeStyle = hexRgba(accent, 0.3)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(80, 354)
      ctx.lineTo(W - 80, 354)
      ctx.stroke()

      // Signatory
      ctx.fillStyle = textColor
      ctx.font = 'bold 13px Georgia,serif'
      ctx.fillText(single.signatory_name || 'Director / Principal', W / 2, 386)

      ctx.fillStyle = tc(0.5)
      ctx.font = '11px Georgia,serif'
      ctx.fillText(single.signatory_title || 'Authorized Signatory', W / 2, 404)

      // Cert ID placeholder
      ctx.fillStyle = tc(0.3)
      ctx.font = '9px monospace'
      ctx.fillText('CERT-XXXXXXXXXXXX', W / 2, 432)

      // QR placeholder
      ctx.strokeStyle = tc(0.15)
      ctx.lineWidth = 1
      ctx.strokeRect(W / 2 - 18, 440, 36, 36)

      ctx.fillStyle = tc(0.2)
      ctx.font = '7px monospace'
      ctx.fillText('QR', W / 2, 461)

      // Footer
      ctx.fillStyle = accent
      ctx.font = '9px Georgia,serif'
      ctx.fillText('CertiFy Sri Lanka — Blockchain Verified', W / 2, 494)
    }

    // Logo or default graduation cap
    if (logo) {
      const img = new Image()
      img.onload = () => {
        ctx.save()
        ctx.beginPath()
        ctx.arc(W / 2, 88, 34, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, W / 2 - 34, 54, 68, 68)
        ctx.restore()
        renderText()
      }
      img.onerror = () => {
        // If logo fails to load, fall back to default
        ctx.fillStyle = hexRgba(accent, 0.15)
        ctx.beginPath()
        ctx.arc(W / 2, 88, 34, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = hexRgba(accent, 0.5)
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.font = '24px serif'
        ctx.fillStyle = accent
        ctx.textAlign = 'center'
        ctx.fillText('🎓', W / 2, 97)
        renderText()
      }
      img.src = logo
    } else {
      // Default graduation cap circle
      ctx.fillStyle = hexRgba(accent, 0.15)
      ctx.beginPath()
      ctx.arc(W / 2, 88, 34, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = hexRgba(accent, 0.5)
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = '24px serif'
      ctx.fillStyle = accent
      ctx.textAlign = 'center'
      ctx.fillText('🎓', W / 2, 97)

      renderText()
    }
  // FIX: all values used inside draw are in the dependency array
  }, [tmpl, single, logo, preview, batchCourse, batchDate, tab, user])

  // FIX: useEffect depends on draw (which is now stable via useCallback)
  // This guarantees the latest state values are always used when drawing.
  useEffect(() => {
    const timer = setTimeout(draw, 50)
    return () => clearTimeout(timer)
  }, [draw])

  // ── canvas → File ──────────────────────────────────────
  const toFile = async (name) => {
    // FIX: re-draw synchronously before capturing blob to get latest state
    draw()
    await new Promise(r => setTimeout(r, 80))
    const canvas = canvasRef.current
    if (!canvas) throw new Error('Canvas not ready')
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
    return new File([blob], `cert_${name}.png`, { type: 'image/png' })
  }

  // ── single issue ───────────────────────────────────────
  const handleSingle = async () => {
    if (!single.holder_name.trim()) return show('Enter recipient name', 'error')
    if (!single.course_name.trim()) return show('Enter course name', 'error')
    if (!single.issue_date)         return show('Set issue date', 'error')

    setIssuing(true)
    try {
      const file = await toFile(single.holder_name)
      const fd = new FormData()
      fd.append('holder_name', single.holder_name.trim())
      fd.append('course_name', single.course_name.trim())
      fd.append('issue_date',  single.issue_date)
      if (single.expiry_date)  fd.append('expiry_date',  single.expiry_date)
      if (single.holder_email) fd.append('holder_email', single.holder_email.trim())
      fd.append('file', file)

      const res = await certificateAPI.upload(fd)
      const email = single.holder_email ? ` Email sent to ${single.holder_email}.` : ''
      show(`✅ Issued! ID: ${res.data.certificate_id}.${email}`, 'success')
      setSingle(p => ({ ...p, holder_name: '', holder_email: '' }))
    } catch (err) {
      const d = err.response?.data?.detail
      show(Array.isArray(d) ? d.map(x => x.msg).join(', ') : (d || 'Issue failed'), 'error')
    } finally { setIssuing(false) }
  }

  // ── batch helpers ──────────────────────────────────────
  const addRow    = () => setStudents(p => [...p, { id: Date.now(), holder_name: '', holder_email: '', expiry_date: '' }])
  const removeRow = (id) => setStudents(p => p.filter(s => s.id !== id))
  const updateRow = (id, k, v) => setStudents(p => p.map(s => s.id === id ? { ...s, [k]: v } : s))

  const importCSV = (e) => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      const lines = ev.target.result.split('\n').filter(Boolean)
      const hasHdr = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('email')
      const rows = (hasHdr ? lines.slice(1) : lines)
        .filter(l => l.trim())
        .map((l, i) => {
          const p = l.split(',').map(x => x.trim())
          return { id: Date.now() + i, holder_name: p[0] || '', holder_email: p[1] || '', expiry_date: p[2] || '' }
        })
        .filter(s => s.holder_name)
      if (rows.length) { setStudents(rows); show(`${rows.length} students imported`, 'success') }
      else show('No valid rows in CSV', 'error')
    }
    r.readAsText(f); e.target.value = ''
  }

  // ── batch issue ────────────────────────────────────────
  const handleBatch = async () => {
    const valid = students.filter(s => s.holder_name.trim())
    if (!batchCourse.trim()) return show('Enter course name', 'error')
    if (!batchDate)          return show('Set issue date', 'error')
    if (!valid.length)       return show('Add at least one student', 'error')

    setIssuing(true); setBatchResults(null)
    const results = []

    for (let i = 0; i < valid.length; i++) {
      const s = valid[i]
      setBatchIdx(i); setPreview(s.holder_name)
      await new Promise(r => setTimeout(r, 150))
      try {
        const file = await toFile(s.holder_name)
        const fd = new FormData()
        fd.append('holder_name', s.holder_name.trim())
        fd.append('course_name', batchCourse.trim())
        fd.append('issue_date',  batchDate)
        if (s.expiry_date)  fd.append('expiry_date',  s.expiry_date)
        if (s.holder_email) fd.append('holder_email', s.holder_email.trim())
        fd.append('file', file)
        const res = await certificateAPI.upload(fd)
        results.push({ holder_name: s.holder_name, holder_email: s.holder_email, certificate_id: res.data.certificate_id, email_sent: !!s.holder_email, status: 'success' })
      } catch (err) {
        results.push({ holder_name: s.holder_name, status: 'failed', error: err.response?.data?.detail || 'Failed' })
      }
    }

    setPreview(''); setBatchIdx(-1); setBatchResults(results); setIssuing(false)
    const ok = results.filter(r => r.status === 'success').length
    const em = results.filter(r => r.email_sent).length
    show(`${ok}/${valid.length} issued. ${em} emails sent.`, ok === valid.length ? 'success' : 'info')
  }

  const validCount = students.filter(s => s.holder_name.trim()).length

  // ── render ─────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <ToastContainer />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(220px,22vw,280px) 1fr',
        gap: 16, alignItems: 'start',
      }} className="template-designer-grid">

        {/* ═══ LEFT ══════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Template picker */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Template Style</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setTmpl(t)} style={{
                  padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                  background: t.bg,
                  border: tmpl.id === t.id ? '2px solid var(--cyan)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: tmpl.id === t.id ? '0 0 12px rgba(0,212,255,0.2)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ height: 3, background: t.accent, borderRadius: 2, marginBottom: 5 }} />
                  <p style={{ color: t.text, fontSize: 10, fontWeight: 600, opacity: 0.9 }}>{t.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Logo upload */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Institution Logo</p>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              border: `2px dashed ${logo ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, cursor: 'pointer',
              background: logo ? 'rgba(0,212,255,0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              {logo
                ? <img src={logo} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="logo" />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏛️</div>
              }
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: logo ? 'var(--cyan)' : 'rgba(255,255,255,0.5)', marginBottom: 1 }}>
                  {logo ? 'Logo uploaded ✓' : 'Upload logo'}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>PNG, JPG</p>
              </div>
              <input type="file" accept=".png,.jpg,.jpeg"
                onChange={e => {
                  const f = e.target.files[0]; if (!f) return
                  const r = new FileReader()
                  r.onload = ev => setLogo(ev.target.result)
                  r.readAsDataURL(f)
                }}
                style={{ display: 'none' }}
              />
            </label>
            {logo && (
              <button onClick={() => setLogo(null)} style={{ marginTop: 8, width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 7, padding: '6px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Remove Logo
              </button>
            )}
          </div>

          {/* Certificate settings */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Certificate Settings</p>

            {/* Locked institution */}
            <div style={{ marginBottom: 10 }}>
              <Label>Institution Name</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 9 }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || 'Institution'}
                </span>
                <span style={{ fontSize: 8, color: 'var(--cyan)', fontWeight: 800, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', padding: '2px 7px', borderRadius: 100, letterSpacing: '0.06em', flexShrink: 0 }}>LOCKED</span>
              </div>
            </div>

            {[
              { k: 'tagline',         lbl: 'Tagline'          },
              { k: 'signatory_name',  lbl: 'Signatory Name'   },
              { k: 'signatory_title', lbl: 'Signatory Title'  },
            ].map(({ k, lbl }) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <Label>{lbl}</Label>
                <input type="text" value={single[k]}
                  onChange={e => setSingle(p => ({ ...p, [k]: e.target.value }))}
                  style={inp()}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT ═════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Canvas preview */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Live Preview</p>
                {preview && <p style={{ color: 'var(--cyan)', fontSize: 10, marginTop: 2 }}>Previewing: <strong>{preview}</strong></p>}
              </div>
              <button
                onClick={() => {
                  const w = window.open('', '_blank')
                  if (w && canvasRef.current) {
                    w.document.write(`<img src="${canvasRef.current.toDataURL()}" style="max-width:100%;display:block;"/>`)
                  }
                }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
              >
                🔍 Full
              </button>
            </div>
            <div style={{ background: '#06101E', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'center', border: '1px solid rgba(0,212,255,0.06)' }}>
              <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block', borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }} />
            </div>
          </div>

          {/* Issue panel */}
          <div style={{ background: 'rgba(9,14,26,0.9)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent)' }} />

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
              {[
                { id: 'single', label: '👤 Single Student' },
                { id: 'batch',  label: `👥 Batch (${validCount})` },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, padding: '13px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  color: tab === t.id ? 'var(--cyan)' : 'rgba(255,255,255,0.35)',
                  borderBottom: tab === t.id ? '2px solid var(--cyan)' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ padding: '20px' }}>

              {/* ── SINGLE ─────────────────────────────── */}
              {tab === 'single' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Label>Recipient Name *</Label>
                      <input type="text" value={single.holder_name}
                        onChange={e => setSingle(p => ({ ...p, holder_name: e.target.value }))}
                        placeholder="Kasun Perera"
                        style={inp()} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                    <div>
                      <Label>Student Email</Label>
                      <input type="email" value={single.holder_email}
                        onChange={e => setSingle(p => ({ ...p, holder_email: e.target.value }))}
                        placeholder="student@email.com"
                        style={inp()} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Course / Qualification *</Label>
                    <input type="text" value={single.course_name}
                      onChange={e => setSingle(p => ({ ...p, course_name: e.target.value }))}
                      placeholder="BSc Computer Science"
                      style={inp()} onFocus={focusIn} onBlur={focusOut}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Label>Issue Date *</Label>
                      <input type="date" value={single.issue_date}
                        onChange={e => setSingle(p => ({ ...p, issue_date: e.target.value }))}
                        style={inp({ colorScheme: 'dark' })} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <input type="date" value={single.expiry_date}
                        onChange={e => setSingle(p => ({ ...p, expiry_date: e.target.value }))}
                        style={inp({ colorScheme: 'dark' })} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                  </div>

                  {single.holder_email && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>✉️</span>
                      <p style={{ color: '#34d399', fontSize: 12, margin: 0 }}>Will email to <strong>{single.holder_email}</strong></p>
                    </div>
                  )}

                  <button onClick={handleSingle}
                    disabled={issuing || !single.holder_name.trim() || !single.course_name.trim()}
                    style={{
                      width: '100%',
                      background: issuing || !single.holder_name.trim() || !single.course_name.trim()
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg,var(--gold),var(--gold-light))',
                      color: issuing || !single.holder_name.trim() || !single.course_name.trim() ? 'rgba(255,255,255,0.25)' : '#000',
                      border: 'none', borderRadius: 10, padding: '13px',
                      fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
                      cursor: issuing || !single.holder_name.trim() || !single.course_name.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                      boxShadow: !issuing && single.holder_name && single.course_name ? 'var(--shadow-gold)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {issuing && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'rgba(0,0,0,0.7)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                    {issuing ? 'Issuing...' : single.holder_email ? '🎓 Issue & Send Email' : '🎓 Issue Certificate'}
                  </button>
                </div>
              )}

              {/* ── BATCH ──────────────────────────────── */}
              {tab === 'batch' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

                  {/* Course + date */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12, padding: '13px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 10 }}>
                    <div>
                      <Label>Course (same for all) *</Label>
                      <input type="text" value={batchCourse} onChange={e => setBatchCourse(e.target.value)}
                        placeholder="BSc Computer Science"
                        style={inp({ background: 'rgba(255,255,255,0.06)' })} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                    <div>
                      <Label>Issue Date *</Label>
                      <input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)}
                        style={inp({ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' })} onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                  </div>

                  {/* Student list header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      Students
                      <span style={{ marginLeft: 7, background: 'var(--cyan)', color: '#000', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>{validCount}</span>
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                        📊 CSV
                        <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
                      </label>
                      <button onClick={addRow} style={{ padding: '6px 14px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: 'var(--cyan)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* CSV hint */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 7, padding: '6px 12px' }}>
                    <code style={{ fontSize: 10, color: 'rgba(0,212,255,0.4)', fontFamily: 'var(--font-mono)' }}>holder_name, email, expiry_date</code>
                  </div>

                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 110px 28px', gap: 6, padding: '0 6px' }}>
                    {['Full Name *', 'Email', 'Expiry', ''].map(h => (
                      <p key={h} style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</p>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
                    {students.map((s, idx) => {
                      const active  = preview === s.holder_name && s.holder_name
                      const current = batchIdx === idx
                      return (
                        <div key={s.id}
                          onClick={() => s.holder_name && setPreview(s.holder_name)}
                          style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr 120px 28px',
                            gap: 6, alignItems: 'center', padding: '7px 10px', borderRadius: 9,
                            background: current ? 'rgba(16,185,129,0.08)' : active ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.02)',
                            border: current ? '1px solid rgba(16,185,129,0.25)' : active ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                            cursor: s.holder_name ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', minWidth: 16 }}>{idx + 1}</span>
                            <input type="text" value={s.holder_name}
                              onChange={e => updateRow(s.id, 'holder_name', e.target.value)}
                              placeholder="Full name"
                              onClick={e => e.stopPropagation()}
                              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', color: '#fff' }}
                            />
                          </div>
                          <input type="email" value={s.holder_email}
                            onChange={e => updateRow(s.id, 'holder_email', e.target.value)}
                            placeholder="email@..."
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.5)', width: '100%' }}
                          />
                          <input type="date" value={s.expiry_date}
                            onChange={e => updateRow(s.id, 'expiry_date', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)', width: '100%', colorScheme: 'dark' }}
                          />
                          <button
                            onClick={e => { e.stopPropagation(); removeRow(s.id) }}
                            disabled={students.length === 1}
                            style={{ background: 'none', border: 'none', flexShrink: 0, color: students.length === 1 ? 'rgba(255,255,255,0.1)' : '#f87171', cursor: students.length === 1 ? 'default' : 'pointer', fontSize: 14 }}
                          >✕</button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary */}
                  <div style={{ display: 'flex', gap: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <strong style={{ color: '#fff' }}>{validCount}</strong> students
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <strong style={{ color: '#34d399' }}>{students.filter(s => s.holder_name && s.holder_email).length}</strong> with email
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>💡 Click row to preview</span>
                  </div>

                  {/* Progress */}
                  {issuing && batchIdx >= 0 && (
                    <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 9, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'var(--cyan)', fontSize: 12, fontWeight: 600 }}>
                          Issuing {batchIdx + 1} of {students.filter(s => s.holder_name).length}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                          {Math.round(((batchIdx + 1) / students.filter(s => s.holder_name).length) * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(((batchIdx + 1) / students.filter(s => s.holder_name).length) * 100)}%`, background: 'linear-gradient(90deg,var(--cyan),var(--gold))', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 5, textAlign: 'center' }}>⏳ Do not close this page</p>
                    </div>
                  )}

                  {/* Batch button */}
                  <button onClick={handleBatch}
                    disabled={issuing || validCount === 0 || !batchCourse.trim()}
                    style={{
                      width: '100%',
                      background: issuing || validCount === 0 || !batchCourse.trim() ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,var(--gold),var(--gold-light))',
                      color: issuing || validCount === 0 || !batchCourse.trim() ? 'rgba(255,255,255,0.25)' : '#000',
                      border: 'none', borderRadius: 10, padding: '13px',
                      fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
                      cursor: issuing || validCount === 0 || !batchCourse.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                      boxShadow: !issuing && validCount > 0 && batchCourse ? 'var(--shadow-gold)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {issuing && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'rgba(0,0,0,0.7)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                    {issuing ? 'Processing — do not close...' : `🎓 Issue ${validCount} Certificate${validCount !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Batch Results */}
          {batchResults && (
            <div style={{ background: 'rgba(9,14,26,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)' }} />
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 13, fontWeight: 700 }}>Batch Results</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { l: 'Issued',  v: batchResults.filter(r => r.status === 'success').length, c: '#34d399' },
                    { l: 'Emailed', v: batchResults.filter(r => r.email_sent).length,            c: '#A78BFA' },
                    { l: 'Failed',  v: batchResults.filter(r => r.status === 'failed').length,   c: '#f87171' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</p>
                      <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {batchResults.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: r.status === 'success' ? 'transparent' : 'rgba(239,68,68,0.04)' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{r.holder_name}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: r.status === 'success' ? 'var(--font-mono)' : 'var(--font-body)' }}>
                        {r.status === 'success' ? r.certificate_id : `Error: ${r.error}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {r.email_sent && <span style={{ fontSize: 9, fontWeight: 800, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', padding: '2px 7px', borderRadius: 100 }}>✉️ SENT</span>}
                      <span style={{ fontSize: 9, fontWeight: 800, color: r.status === 'success' ? '#34d399' : '#f87171', background: r.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${r.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, padding: '2px 8px', borderRadius: 100 }}>
                        {r.status === 'success' ? '✓ ISSUED' : '✗ FAILED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 18px' }}>
                <button onClick={() => setBatchResults(null)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', borderRadius: 7, padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Clear Results
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}