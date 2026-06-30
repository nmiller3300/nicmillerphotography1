'use client'

interface PrintItem {
  img: string
  t: string
  loc: string
  ed: string
  paper: string
  sizes: string[]
  from: number
  externalUrl?: string | null
}

export default function PrintModal({ print, onClose, storeUrl }: { print: PrintItem; onClose: () => void; storeUrl?: string }) {
  const href = print.externalUrl || storeUrl || '#'
  const hasDirectLink = !!print.externalUrl

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(5,4,3,0.84)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'nmover .3s ease both' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '760px', width: '100%', borderRadius: '20px', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(24,21,17,0.96), rgba(14,12,10,0.96))', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 90px rgba(0,0,0,0.65)', display: 'flex', flexWrap: 'wrap', position: 'relative' }}
      >
        <div style={{ flex: '1 1 280px', minHeight: '260px', background: '#100d0a', position: 'relative', overflow: 'hidden' }}>
          <img src={print.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: '1 1 300px', padding: '28px' }}>
          <div style={{ fontFamily: 'var(--font-jost)', fontSize: '24px', marginBottom: '4px' }}>{print.t}</div>
          <div style={{ fontSize: '13px', color: 'rgba(244,241,236,0.55)', marginBottom: '20px' }}>{print.loc} · {print.ed}</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(244,241,236,0.5)', marginBottom: '10px' }}>SIZE</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
            {print.sizes.map(sz => (
              <span key={sz} style={{ padding: '9px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '13px' }}>{sz}</span>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(244,241,236,0.6)', marginBottom: '4px' }}>Paper · {print.paper}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 0', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(244,241,236,0.5)' }}>
              FROM <span style={{ fontFamily: 'var(--font-jost)', fontSize: '24px', color: '#e3b463', letterSpacing: 0, marginLeft: '4px' }}>${print.from}</span>
            </div>
            <a href={href} target="_blank" rel="noreferrer" className="nm-gold" style={{ padding: '13px 22px', borderRadius: '11px', background: 'linear-gradient(180deg,#d49a40,#b07c2e)', color: '#1a130a', fontWeight: 600, fontSize: '11.5px', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', textDecoration: 'none', display: 'inline-block' }}>
              {hasDirectLink ? 'BUY\u00a0THIS\u00a0PRINT' : 'CONTINUE\u00a0TO\u00a0STORE'}
            </a>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.18)', color: '#f4f1ec', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
    </div>
  )
}
