'use client'

import { useState } from 'react'
import PrintModal from './PrintModal'

interface PrintItem { t: string; loc: string; img: string; from: number; ed: string; paper: string; sizes: string[]; featured: boolean; externalUrl?: string | null }

export default function PrintsClient({ prints, storeUrl }: { prints: PrintItem[]; storeUrl: string }) {
  const [modal, setModal] = useState<PrintItem | null>(null)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '20px' }}>
        {prints.map((p, i) => (
          <div key={i} className="nm-lift" style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(20,17,13,0.85), rgba(13,11,10,0.8))', boxShadow: '0 16px 44px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', aspectRatio: '3/2', background: '#100d0a', overflow: 'hidden' }}>
              <img src={p.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {p.featured && <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '9px', letterSpacing: '0.18em', padding: '5px 10px', borderRadius: '7px', background: 'rgba(200,146,60,0.92)', color: '#1a130a', fontWeight: 700 }}>FEATURED</span>}
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <h3 style={{ fontFamily: 'var(--font-jost)', fontWeight: 400, fontSize: '19px', letterSpacing: '0.02em', margin: 0, color: '#f4f1ec' }}>{p.t}</h3>
              <div style={{ fontSize: '12.5px', color: 'rgba(244,241,236,0.55)' }}>{p.loc} · {p.ed}</div>
              <div style={{ fontSize: '12px', color: 'rgba(244,241,236,0.45)', marginTop: '2px' }}>{p.paper}</div>
              <div style={{ flex: 1 }}></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '10.5px', letterSpacing: '0.14em', color: 'rgba(244,241,236,0.5)' }}>FROM <span style={{ fontFamily: 'var(--font-jost)', fontSize: '20px', color: '#e3b463', letterSpacing: 0, marginLeft: '3px' }}>${p.from}</span></div>
                <button onClick={() => setModal(p)} className="nm-gold" style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(200,146,60,0.5)', background: 'rgba(200,146,60,0.1)', color: '#e3b463', fontSize: '10.5px', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'var(--font-manrope)' }}>
                  VIEW&nbsp;OPTIONS
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && <PrintModal print={modal} onClose={() => setModal(null)} storeUrl={storeUrl} />}
    </>
  )
}
