'use client'

import { useRouter } from 'next/navigation'

interface LightboxPhoto {
  img: string
  t: string
  loc: string
  cat: string
}

export default function Lightbox({ photo, onClose }: { photo: LightboxPhoto; onClose: () => void }) {
  const router = useRouter()

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(5,4,3,0.86)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'nmover .3s ease both' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', maxHeight: '74vh', aspectRatio: '3/2', background: `#100d0a url('${photo.img}') center/cover`, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#e3b463', marginBottom: '7px' }}>{photo.cat.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--font-jost)', fontSize: '26px' }}>{photo.t}</div>
            <div style={{ fontSize: '13px', color: 'rgba(244,241,236,0.6)', marginTop: '4px' }}>{photo.loc}</div>
          </div>
          <button
            onClick={() => { onClose(); router.push('/prints') }}
            className="nm-gold"
            style={{ padding: '13px 22px', borderRadius: '11px', border: '1px solid rgba(200,146,60,0.5)', background: 'rgba(200,146,60,0.1)', color: '#e3b463', fontSize: '11px', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'var(--font-manrope)' }}
          >
            AVAILABLE&nbsp;AS&nbsp;PRINT
          </button>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: '24px', right: '24px', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#f4f1ec', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
  )
}
