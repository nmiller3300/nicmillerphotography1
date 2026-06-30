'use client'

import { useState } from 'react'
import Link from 'next/link'
import Lightbox from './Lightbox'

interface Photo { id?: number; t: string; loc: string; cat: string; img: string }

export default function HomeClient({ gallery }: { gallery: Photo[] }) {
  const [lightbox, setLightbox] = useState<Photo|null>(null)

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'14px' }} className="nm-home-grid">
        {gallery.slice(0,5).map((p, i) => (
          <button key={i} onClick={() => setLightbox(p)} className="nm-tw nm-lift" style={{ position:'relative', aspectRatio:'4/3', borderRadius:'14px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', padding:0, background:'#15120e', color:'#f4f1ec', display:'block' }}>
            <div className="nm-thumb" style={{ position:'absolute', inset:0, backgroundImage:`url('${p.img}')`, backgroundSize:'cover', backgroundPosition:'center' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.6))' }} />
            <div style={{ position:'absolute', left:'10px', right:'10px', bottom:'9px', textAlign:'left' }}>
              <div style={{ fontSize:'11px', fontWeight:600, color:'#f4f1ec', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textShadow:'0 1px 6px rgba(0,0,0,0.8)' }}>{p.t}</div>
              <div style={{ fontSize:'9.5px', color:'rgba(244,241,236,0.6)' }}>{p.cat}</div>
            </div>
          </button>
        ))}
      </div>
      <style>{`
        @media (max-width: 700px) { .nm-home-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 420px) { .nm-home-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      {lightbox && (
        <Lightbox
          photo={lightbox}
          onClose={() => setLightbox(null)}
          detailUrl={lightbox.id ? `/photos/${lightbox.id}` : undefined}
        />
      )}
    </>
  )
}
