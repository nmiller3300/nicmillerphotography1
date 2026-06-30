'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface Photo { id?: number; t: string; loc: string; cat: string; img: string; fullImg?: string; aspect?: number }

export default function PortfolioClient({ gallery, categories }: { gallery: Photo[]; categories: string[] }) {
  const [cat, setCat] = useState('All')
  const [loaded, setLoaded] = useState<Record<number,boolean>>({})
  const chips = ['All', ...categories]
  const filtered = cat === 'All' ? gallery : gallery.filter(p => p.cat === cat)
  const onLoad = useCallback((i: number) => setLoaded(prev => ({...prev,[i]:true})), [])

  return (
    <>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'36px' }}>
        {chips.map(c => (
          <button key={c} onClick={() => setCat(c)} className="nm-cat" style={{ padding:'9px 20px', borderRadius:'10px', cursor:'pointer', fontFamily:'var(--font-manrope)', fontSize:'12.5px', letterSpacing:'0.08em', border:`1px solid ${cat===c?'rgba(200,146,60,0.5)':'rgba(255,255,255,0.1)'}`, background:cat===c?'rgba(200,146,60,0.14)':'rgba(255,255,255,0.03)', color:cat===c?'#e3b463':'rgba(244,241,236,0.7)' }}>{c}</button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'rgba(244,241,236,0.3)', fontSize:14 }}>Publish photos in the admin panel to display them here.</div>
      )}
      <div className="nm-masonry">
        {filtered.map((p, i) => {
          const DetailLink = p.id ? Link : 'div'
          const linkProps = p.id ? { href:`/photos/${p.id}` } : {}
          return (
            <DetailLink key={i} {...(linkProps as Record<string,unknown>)} className="nm-masonry-item nm-tw" style={{ width:'100%', display:'block', textDecoration:'none', color:'inherit' }}>
              <div style={{ position:'relative', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'#12100e' }}>
                {!loaded[i] && <div className="nm-skel" style={{ width:'100%', aspectRatio:p.aspect?String(p.aspect):'4/3' }} />}
                <img src={p.img} alt={p.t} loading="lazy" onLoad={()=>onLoad(i)} style={{ width:'100%', display:'block', opacity:loaded[i]?1:0, transition:'opacity .4s, transform .5s', borderRadius:'12px' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.72))', borderRadius:'12px' }} />
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'14px', opacity:loaded[i]?1:0, borderRadius:'12px' }}>
                  <div style={{ fontSize:'10px', letterSpacing:'0.18em', color:'#e3b463', marginBottom:'4px' }}>{p.cat.toUpperCase()}</div>
                  <div style={{ fontFamily:'var(--font-jost)', fontSize:'16px', color:'#f4f1ec', fontWeight:400 }}>{p.t}</div>
                  {p.loc && <div style={{ fontSize:'11.5px', color:'rgba(244,241,236,0.6)', marginTop:'2px' }}>{p.loc}</div>}
                </div>
              </div>
            </DetailLink>
          )
        })}
      </div>
    </>
  )
}
