import { useRef } from 'react'
import { certificateAPI } from '../services/api'

export default function VerificationReport({ result, onClose }) {
  const printRef = useRef()
  const { certificate: cert, blockchain, verification } = result
  const isValid = verification?.overall_valid
  const timestamp = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const handlePrint = () => {
    const printContent = document.getElementById('verification-report-print')
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`
      <html>
        <head>
          <title>Verification Report — ${cert?.certificate_id}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap" rel="stylesheet"/>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'DM Sans', sans-serif; background: #fff; color: #2E2B22; }
            .report { max-width: 750px; margin: 0 auto; padding: 40px; }
            .header { background: #0B1F3A; color: white; padding: 28px 32px; border-radius: 12px 12px 0 0; position: relative; overflow: hidden; }
            .gold-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #C9A84C, #E8C96D); }
            .header-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
            .header-sub { color: rgba(255,255,255,0.5); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
            .status-banner { padding: 20px 32px; display: flex; align-items: center; gap: 16px; background: ${isValid ? '#EAF4EE' : '#FCEAEA'}; border-left: 4px solid ${isValid ? '#1A6B3C' : '#8B1A1A'}; }
            .status-icon { width: 48px; height: 48px; border-radius: 50%; background: ${isValid ? '#1A6B3C' : '#8B1A1A'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
            .status-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: ${isValid ? '#1A6B3C' : '#8B1A1A'}; margin-bottom: 3px; }
            .status-sub { font-size: 13px; color: ${isValid ? '#2d7a4f' : '#9b2020'}; }
            .body { padding: 28px 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px; }
            .section-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #0B1F3A; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 28px; margin-bottom: 24px; }
            .field-label { font-size: 10px; color: #9E9A8E; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 3px; }
            .field-value { font-size: 13px; color: #2E2B22; font-weight: 500; }
            .field-value.mono { font-family: 'DM Mono', monospace; font-size: 11px; word-break: break-all; }
            .checks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
            .check { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px; }
            .check.pass { background: #EAF4EE; border: 1px solid rgba(26,107,60,0.2); }
            .check.fail { background: #FCEAEA; border: 1px solid rgba(139,26,26,0.2); }
            .check-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }
            .check-label { font-size: 11px; font-weight: 600; }
            .check-desc { font-size: 10px; color: #666; }
            .hash-box { background: #F8F7F4; border: 1px solid #eee; border-radius: 6px; padding: 10px 12px; font-family: 'DM Mono', monospace; font-size: 9px; color: #5C5849; word-break: break-all; line-height: 1.6; margin-bottom: 20px; }
            .footer { background: #F8F7F4; border-radius: 8px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .footer-text { font-size: 11px; color: #9E9A8E; }
            .stamp { width: 72px; height: 72px; border-radius: 50%; border: 3px solid ${isValid ? '#1A6B3C' : '#8B1A1A'}; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-15deg); opacity: 0.8; }
            .stamp-icon { font-size: 22px; color: ${isValid ? '#1A6B3C' : '#8B1A1A'}; }
            .stamp-text { font-size: 7px; font-weight: 800; color: ${isValid ? '#1A6B3C' : '#8B1A1A'}; letter-spacing: 0.05em; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(11,31,58,0.04); pointer-events: none; font-family: 'Playfair Display', serif; white-space: nowrap; z-index: -1; }
            .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    win.document.close()
    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  }

  const checks = [
    { label: 'Database Record', passed: verification?.db_check, desc: verification?.db_check ? 'Found in system' : 'Not found' },
    { label: 'Blockchain Verified', passed: verification?.blockchain_check, desc: verification?.blockchain_check ? 'On-chain confirmed' : 'Not on blockchain' },
    { label: 'Hash Integrity', passed: verification?.hash_integrity, desc: verification?.hash_integrity ? 'Data unmodified' : 'Hash mismatch' },
    { label: 'Fraud Analysis', passed: verification?.fraud_risk !== 'high', desc: cert?.fraud_score === 'pending' ? 'Pending' : `${cert?.fraud_score}% risk` },
  ]

  return (
    <>
      {/* Modal Overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24
      }} onClick={e => e.target === e.currentTarget && onClose()}>

        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          width: '100%', maxWidth: 680,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          {/* Modal Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--white)',
            borderBottom: '1px solid var(--gray-100)',
            padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--navy)', fontSize: 16, fontWeight: 600
              }}>Verification Report</p>
              <p style={{ color: 'var(--gray-400)', fontSize: 12 }}>
                Official credential verification receipt
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={handlePrint}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--navy)', color: 'var(--white)',
                  border: 'none', borderRadius: 8,
                  padding: '9px 18px', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)'
                }}
              >🖨️ Download / Print PDF</button>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--gray-100)', border: 'none',
                  borderRadius: '50%', width: 32, height: 32,
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--gray-600)'
                }}
              >✕</button>

              {/* WhatsApp Share Button */}
<button
  onClick={() => {
    const url = `${window.location.origin}/verify/${cert?.certificate_id}`
    const msg = encodeURIComponent(
      `✅ Verified Certificate\n\n` +
      `Name: ${cert?.holder_name}\n` +
      `Course: ${cert?.course_name}\n` +
      `Institution: ${cert?.institution_name}\n` +
      `Status: ${isValid ? 'VALID ✓' : 'INVALID ✗'}\n\n` +
      `Verify here: ${url}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }}
  style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#25D366', color: 'white',
    border: 'none', borderRadius: 8,
    padding: '9px 18px', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)'
  }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
  WhatsApp
</button>
            </div>
          </div>

          {/* Report Content */}
          <div style={{ padding: 24 }}>
            <div id="verification-report-print">
              <div className="report">
                <div className="watermark">CERTIFY</div>

                {/* Report Header */}
                <div className="header">
                  <div className="gold-bar"/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="header-title">Credential Verification Report</div>
                      <div className="header-sub">CertVerify Sri Lanka — Official Record</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 3 }}>REPORT GENERATED</div>
                      <div style={{ color: '#C9A84C', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>{timestamp}</div>
                    </div>
                  </div>
                </div>

                {/* Status Banner */}
                <div className="status-banner">
                  <div className="status-icon">{isValid ? '✓' : '✗'}</div>
                  <div>
                    <div className="status-title">
                      {isValid ? 'Certificate Verified — Authentic' : 'Certificate Invalid'}
                    </div>
                    <div className="status-sub">
                      {isValid
                        ? 'This credential has passed all verification checks including blockchain validation'
                        : cert?.is_revoked
                        ? `Revoked: ${cert?.revocation_reason || 'No reason given'}`
                        : 'This certificate failed one or more verification checks'}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <div className="stamp">
                      <div className="stamp-icon">{isValid ? '✓' : '✗'}</div>
                      <div className="stamp-text">{isValid ? 'VERIFIED' : 'INVALID'}</div>
                    </div>
                  </div>
                </div>

                <div className="body">

                  {/* Certificate Holder */}
                  <div style={{ textAlign: 'center', padding: '20px 0 24px', borderBottom: '1px solid #eee', marginBottom: 24 }}>
                    <div style={{ fontSize: 10, color: '#9E9A8E', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>This certifies that</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#0B1F3A', marginBottom: 6 }}>{cert?.holder_name}</div>
                    <div style={{ fontSize: 13, color: '#5C5849', marginBottom: 4 }}>has successfully completed</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#0B1F3A' }}>{cert?.course_name}</div>
                    <div style={{ fontSize: 12, color: '#9E9A8E', marginTop: 6 }}>Issued by {cert?.institution_name}</div>
                  </div>

                  {/* Certificate Details */}
                  <div className="section-title">Certificate Details</div>
                  <div className="grid">
                    {[
                      { label: 'Certificate ID', value: cert?.certificate_id, mono: true },
                      { label: 'Institution', value: cert?.institution_name },
                      { label: 'Issue Date', value: cert?.issue_date },
                      { label: 'Expiry Date', value: cert?.expiry_date || 'No Expiry' },
                      { label: 'Fraud Risk Score', value: cert?.fraud_score === 'pending' ? 'Pending' : `${cert?.fraud_score}%` },
                      { label: 'Certificate Status', value: cert?.is_revoked ? 'REVOKED' : cert?.is_valid ? 'VALID' : 'INVALID' },
                    ].map(({ label, value, mono }) => (
                      <div key={label}>
                        <div className="field-label">{label}</div>
                        <div className={`field-value ${mono ? 'mono' : ''}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <hr className="divider"/>

                  {/* Verification Checks */}
                  <div className="section-title">Verification Results</div>
                  <div className="checks">
                    {checks.map((c, i) => (
                      <div key={i} className={`check ${c.passed ? 'pass' : 'fail'}`}>
                        <div className="check-icon" style={{ background: c.passed ? '#1A6B3C' : '#8B1A1A' }}>
                          {c.passed ? '✓' : '✗'}
                        </div>
                        <div>
                          <div className="check-label" style={{ color: c.passed ? '#1A6B3C' : '#8B1A1A' }}>{c.label}</div>
                          <div className="check-desc">{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="divider"/>

                  {/* Blockchain Record */}
                  <div className="section-title">Blockchain Record</div>
                  {cert?.blockchain_hash ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px', marginBottom: 12 }}>
                        <div>
                          <div className="field-label">Network</div>
                          <div className="field-value">Polygon (Amoy Testnet)</div>
                        </div>
                        <div>
                          <div className="field-label">Status</div>
                          <div className="field-value" style={{ color: blockchain?.is_valid ? '#1A6B3C' : '#8B1A1A' }}>
                            {blockchain?.is_valid ? '⛓️ On-chain Verified' : '⚠️ Not Found'}
                          </div>
                        </div>
                      </div>
                      <div className="field-label" style={{ marginBottom: 4 }}>Certificate Hash (SHA-256)</div>
                      <div className="hash-box">{cert?.blockchain_hash}</div>
                      {cert?.blockchain_tx && (
                        <>
                          <div className="field-label" style={{ marginBottom: 4 }}>Transaction Hash</div>
                          <div className="hash-box">{cert?.blockchain_tx}</div>
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#9E9A8E', fontSize: 13, fontStyle: 'italic', marginBottom: 20 }}>
                      No blockchain record found for this certificate.
                    </div>
                  )}

                  {/* Footer */}
                  <div className="footer">
                    <div>
                      <div className="footer-text" style={{ fontWeight: 600, color: '#0B1F3A', marginBottom: 2 }}>
                        CertVerify Sri Lanka
                      </div>
                      <div className="footer-text">Official Credential Verification Platform</div>
                      <div className="footer-text">certverify.lk | admin@certverify.lk</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="footer-text" style={{ fontWeight: 600, marginBottom: 2 }}>Verified At</div>
                      <div className="footer-text" style={{ fontFamily: 'DM Mono, monospace' }}>{timestamp}</div>
                      <div className="footer-text" style={{ marginTop: 4, color: '#C9A84C' }}>
                        certverify.lk/verify/{cert?.certificate_id}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}