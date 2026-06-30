export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'

export default async function PrintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const printId = parseInt(id)
  if (isNaN(printId)) notFound()

  try {
    const rows = await db.$queryRawUnsafe<Array<{
      id: number; title: string; location: string|null; edition: string|null
      paper: string|null; from_price: number|null; featured: boolean
      external_url: string|null; store_url: string|null
      thumb_url: string|null; display_url: string|null
    }>>(`
      SELECT p.id, p.title, p.location, p.edition, p.paper, p.from_price,
             p.featured, p.external_url, s.store_url,
             thumb.url as thumb_url, disp.url as display_url
      FROM prints p
      LEFT JOIN media m   ON m.id = p.media_id
      LEFT JOIN derivatives thumb ON thumb.media_id = m.id AND thumb.format = 'webp' AND thumb.width = 960
      LEFT JOIN derivatives disp  ON disp.media_id  = m.id AND disp.format  = 'webp' AND disp.width  = 1440
      LEFT JOIN settings s ON s.id = 1
      WHERE p.id = ${printId} AND p.published = true
      LIMIT 1
    `)
    if (!rows.length) notFound()
    const p = rows[0]
    const href = p.external_url || p.store_url || '#'
    const img  = p.display_url || p.thumb_url || '/featured.jpg'

    // Prev/next prints
    const nav = await db.$queryRawUnsafe<Array<{id:number,title:string}>>(`
      (SELECT id, title FROM prints WHERE published=true AND id < ${printId} ORDER BY id DESC LIMIT 1)
      UNION ALL
      (SELECT id, title FROM prints WHERE published=true AND id > ${printId} ORDER BY id ASC  LIMIT 1)
    `)
    const prev = nav.find(n => n.id < printId) || null
    const next = nav.find(n => n.id > printId) || null

    return (
      <div style={{ background:'#0b0a09', minHeight:'100vh', color:'#f4f1ec' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'clamp(28px,6vh,60px) 28px 80px', animation:'nmrise .5s ease both' }}>

          <Link href="/prints" style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(244,241,236,0.5)', marginBottom:28, fontFamily:'var(--font-manrope)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
            Back to Print Shop
          </Link>

          {p.featured && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:9.5, letterSpacing:'0.18em', padding:'4px 12px', borderRadius:7, background:'rgba(200,146,60,0.9)', color:'#1a130a', fontWeight:700, marginBottom:20 }}>★ FEATURED PRINT</div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:40, alignItems:'start' }}>

            {/* Photo */}
            <div style={{ borderRadius:18, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'#0e0c0a', boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>
              <img src={img} alt={p.title} style={{ width:'100%', display:'block', maxHeight:'70vh', objectFit:'contain' }} />
            </div>

            {/* Details */}
            <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
              <div>
                <div style={{ fontSize:'11px', letterSpacing:'0.26em', color:'#c8923c', marginBottom:12 }}>FINE ART PRINT</div>
                <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(28px,4vw,46px)', letterSpacing:'0.02em', margin:'0 0 8px', color:'#f4f1ec', lineHeight:1.1 }}>{p.title}</h1>
                {p.location && <div style={{ fontSize:14, color:'rgba(244,241,236,0.6)' }}>{p.location}</div>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                {p.edition && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13.5 }}>
                    <span style={{ color:'rgba(244,241,236,0.45)', fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', alignSelf:'center' }}>Edition</span>
                    <span style={{ color:'#f4f1ec' }}>{p.edition}</span>
                  </div>
                )}
                {p.paper && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13.5 }}>
                    <span style={{ color:'rgba(244,241,236,0.45)', fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', alignSelf:'center' }}>Paper</span>
                    <span style={{ color:'#f4f1ec' }}>{p.paper}</span>
                  </div>
                )}
                {p.from_price && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0' }}>
                    <span style={{ color:'rgba(244,241,236,0.45)', fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase' }}>Starting from</span>
                    <span style={{ fontFamily:'var(--font-jost)', fontSize:34, color:'#e3b463' }}>${p.from_price}</span>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <a href={href} target="_blank" rel="noreferrer" className="nm-gold" style={{ padding:'16px', borderRadius:14, background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:700, fontSize:13, letterSpacing:'0.14em', textDecoration:'none', display:'block', textAlign:'center', border:'none', fontFamily:'var(--font-manrope)' }}>
                  {p.external_url ? 'ORDER THIS PRINT →' : 'VISIT PRINT STORE →'}
                </a>
                <Link href="/contact" className="nm-hl" style={{ padding:'14px', borderRadius:14, border:'1px solid rgba(255,255,255,0.14)', color:'rgba(244,241,236,0.7)', fontSize:12.5, letterSpacing:'0.1em', textDecoration:'none', display:'block', textAlign:'center', fontFamily:'var(--font-manrope)', background:'none' }}>
                  INQUIRE ABOUT THIS PRINT
                </Link>
              </div>

              <div style={{ padding:'16px 20px', borderRadius:13, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', fontSize:12.5, color:'rgba(244,241,236,0.45)', lineHeight:1.6 }}>
                Your order is fulfilled by a professional lab. High-resolution files are kept private and never shared publicly.
              </div>
            </div>
          </div>

          {/* Prev / Next */}
          <div style={{ display:'flex', justifyContent:'space-between', gap:16, marginTop:52, paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            {prev ? (
              <Link href={`/prints/${prev.id}`} className="nm-hl" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(244,241,236,0.55)', fontFamily:'var(--font-manrope)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
                {prev.title}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/prints/${next.id}`} className="nm-hl" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(244,241,236,0.55)', fontFamily:'var(--font-manrope)' }}>
                {next.title}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6l6 6-6 6"/></svg>
              </Link>
            ) : <span />}
          </div>
        </div>
        <Footer />
      </div>
    )
  } catch {
    notFound()
  }
}
