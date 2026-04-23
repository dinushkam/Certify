import TemplateDesigner from '../components/institution/TemplateDesigner'

export default function TemplateDesignerPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        padding: '22px 28px',
      }}>
        <div style={{ maxWidth: 1340, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 100, padding: '4px 12px', marginBottom: 7,
          }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--cyan)', boxShadow:'0 0 6px var(--cyan)' }} />
            <span style={{ color:'var(--cyan)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Institution Portal
            </span>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', color:'#fff', fontSize:24, fontWeight:700, letterSpacing:'-0.02em' }}>
            Certificate Template Designer
          </h1>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:3 }}>
            Design, preview and issue certificates — blockchain registered automatically
          </p>
        </div>
      </div>
      <div style={{ maxWidth:1340, margin:'0 auto', padding:'22px 24px' }}>
        <TemplateDesigner />
      </div>
    </div>
  )
}