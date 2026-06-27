'use client'

import { useState } from 'react'
import Lightbox from './Lightbox'

interface Photo { t: string; loc: string; cat: string; img: string }

export default function HomeClient({ gallery }: { gallery: Photo[] }) {
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '16px' }}>
        {gallery.map((p, i) => (
          <button key={i} onClick={() => setLightbox(p)} className="nm-tw nm-lift" style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', padding: 0, background: '#15120e', color: '#f4f1ec' }}>
            <div className="nm-thumb" style={{ position: 'absolute', inset: 0, backgroundImage: `url('${p.img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.55))' }}></div>
            <div style={{ position: 'absolute', left: '11px', right: '11px', bottom: '10px', textAlign: 'left' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#f4f1ec', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>{p.t}</div>
              <div style={{ fontSize: '9.5px', color: 'rgba(244,241,236,0.6)' }}>{p.cat}</div>
            </div>
          </button>
        ))}
      </div>
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}
