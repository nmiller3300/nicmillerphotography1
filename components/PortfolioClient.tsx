'use client'

import { useState } from 'react'
import Lightbox from './Lightbox'

interface Photo { t: string; loc: string; cat: string; img: string }

export default function PortfolioClient({ gallery, categories }: { gallery: Photo[]; categories: string[] }) {
  const [cat, setCat] = useState('All')
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  const chips = ['All', ...categories]
  const filtered = cat === 'All' ? gallery : gallery.filter(p => p.cat === cat)

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '34px' }}>
        {chips.map(c => (
          <button key={c} onClick={() => setCat(c)} className="nm-cat" style={{ padding: '9px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontSize: '12px', letterSpacing: '0.08em', border: `1px solid ${cat === c ? 'rgba(200,146,60,0.5)' : 'rgba(255,255,255,0.12)'}`, background: cat === c ? 'rgba(200,146,60,0.16)' : 'rgba(255,255,255,0.03)', color: cat === c ? '#e3b463' : 'rgba(244,241,236,0.7)' }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '18px' }}>
        {filtered.map((p, i) => (
          <button key={i} onClick={() => setLightbox(p)} className="nm-tw nm-lift" style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', padding: 0, background: '#15120e', color: '#f4f1ec' }}>
            <div className="nm-thumb" style={{ position: 'absolute', inset: 0, backgroundImage: `url('${p.img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.72))' }}></div>
            <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '15px', textAlign: 'left' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#e3b463', marginBottom: '6px' }}>{p.cat.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-jost)', fontSize: '18px', letterSpacing: '0.02em', color: '#f4f1ec', textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>{p.t}</div>
              <div style={{ fontSize: '11.5px', color: 'rgba(244,241,236,0.6)', marginTop: '3px' }}>{p.loc}</div>
            </div>
          </button>
        ))}
      </div>

      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}
