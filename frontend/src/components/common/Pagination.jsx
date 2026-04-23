// ─── Pagination.jsx ───────────────────────────────────────────────────────────
export default function Pagination({ skip, limit, total, onPage }) {
  const currentPage = Math.floor(skip / limit) + 1
  const totalPages  = Math.ceil(total / limit)

  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const btnBase = {
    height: 32,
    minWidth: 32,
    borderRadius: 7,
    border: '1px solid rgba(0,212,255,0.12)',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.45)',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 10px',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderTop: '1px solid rgba(0,212,255,0.06)',
      flexWrap: 'wrap', gap: 10,
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.25)',
        fontSize: 10, letterSpacing: '0.08em',
      }}>
        {skip + 1}–{Math.min(skip + limit, total)} of {total} records
      </p>

      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onPage(skip - limit)}
          disabled={currentPage === 1}
          style={{
            ...btnBase,
            opacity: currentPage === 1 ? 0.3 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (currentPage !== 1) { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = 'var(--cyan)' }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
        >← Prev</button>

        {pages.map((page, i) => (
          <button
            key={i}
            onClick={() => page !== '...' && onPage((page - 1) * limit)}
            disabled={page === '...' || page === currentPage}
            style={{
              ...btnBase,
              background: page === currentPage
                ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: page === currentPage ? 'var(--cyan)' : 'rgba(255,255,255,0.45)',
              borderColor: page === currentPage
                ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.12)',
              boxShadow: page === currentPage ? '0 0 10px rgba(0,212,255,0.1)' : 'none',
              cursor: page === '...' || page === currentPage ? 'default' : 'pointer',
            }}
          >{page}</button>
        ))}

        <button
          onClick={() => onPage(skip + limit)}
          disabled={currentPage === totalPages}
          style={{
            ...btnBase,
            opacity: currentPage === totalPages ? 0.3 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (currentPage !== totalPages) { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = 'var(--cyan)' }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
        >Next →</button>
      </div>
    </div>
  )
}