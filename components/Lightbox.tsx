'use client'

import Link from 'next/link'

interface LightboxPhoto { img: string; t: string; loc: string; cat: string }

export default function Lightbox({ photo, onClose, detailUrl }: { photo: LightboxPhoto; onClose: () => void; detailUrl?: string }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:150, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'rgba(5,4,3,0.88)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', animation:'nmover .3s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth:'1000px', width:'100%', display:'flex', flexDirection:'column', gap:'16px' }}>
        <div style={{ position:'relative', borderRadius:'16px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 30px 80px rgba(0,0,0,0.6)', background:'#0e0c0a' }}>
          <img src={photo.img} alt={photo.t} style={{ width:'100%', maxHeight:'76vh', objectFit:'contain', display:'block' }} />
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:'10px', letterSpacing:'0.2em', color:'#e3b463', marginBottom:'6px' }}>{photo.cat.toUpperCase()}</div>
            <div style={{ fontFamily:'var(--font-jost)', fontSize:'22px', color:'#f4f1ec' }}>{photo.t}</div>
            {photo.loc && <div style={{ fontSize:'13px', color:'rgba(244,241,236,0.6)', marginTop:'3px' }}>{photo.loc}</div>}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {detailUrl && (
              <Link href={detailUrl} onClick={onClose} className="nm-hl" style={{ padding:'11px 20px', borderRadius:'11px', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(244,241,236,0.8)', fontSize:'11px', letterSpacing:'0.14em', fontFamily:'var(--font-manrope)', display:'inline-block' }}>
                VIEW&nbsp;DETAILS
              </Link>
            )}
            <Link href="/prints" onClick={onClose} className="nm-gold" style={{ padding:'11px 20px', borderRadius:'11px', border:'1px solid rgba(200,146,60,0.5)', background:'rgba(200,146,60,0.1)', color:'#e3b463', fontSize:'11px', letterSpacing:'0.14em', fontFamily:'var(--font-manrope)', display:'inline-block' }}>
              AVAILABLE&nbsp;AS&nbsp;PRINT
            </Link>
          </div>
        </div>
      </div>
      <button onClick={onClose} style={{ position:'fixed', top:'22px', right:'22px', width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.16)', color:'#f4f1ec', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
  )
}
