export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Footer from '@/components/Footer'
import PrintsClient from '@/components/PrintsClient'
import { db } from '@/lib/db'

async function getData() {
  try {
    const [prints, settings] = await Promise.all([
      db.$queryRawUnsafe<Array<{id:number,title:string,location:string,from_price:number,edition:string,paper:string,featured:boolean,published:boolean,thumb_url:string,external_url:string}>>(`
        SELECT p.id, p.title, p.location, p.from_price, p.edition, p.paper,
               p.featured, p.published, p.external_url,
               d.url as thumb_url
        FROM prints p
        LEFT JOIN media m ON m.id = p.media_id
        LEFT JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 960
        WHERE p.published = true
        ORDER BY p.featured DESC, p.id ASC
      `),
      db.$queryRawUnsafe<Array<{store_url:string}>>(`SELECT store_url FROM settings WHERE id = 1 LIMIT 1`),
    ])
    const storeUrl = settings[0]?.store_url || '#'
    const fp = prints.find(p => p.featured) || prints[0] || null
    const rest = fp ? prints.filter(p => p.id !== fp.id) : prints
    const toPrint = (p: typeof prints[0]) => ({
      id: p.id, t: p.title, loc: p.location||'', img: p.thumb_url||'/featured.jpg',
      from: p.from_price||0, ed: p.edition||'', paper: p.paper||'',
      sizes:[], featured: p.featured, externalUrl: p.external_url||null,
    })
    return { featured: fp ? toPrint(fp) : null, rest: rest.map(toPrint), storeUrl }
  } catch {
    return { featured: null, rest: [], storeUrl: '#' }
  }
}

export default async function PrintsPage() {
  const { featured, rest, storeUrl } = await getData()
  return (
    <div style={{ background:'#0b0a09', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ maxWidth:'1264px', margin:'0 auto', padding:'clamp(40px,8vh,70px) 32px 0', animation:'nmrise .6s ease both' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ fontSize:'12px', letterSpacing:'0.34em', color:'#c8923c', marginBottom:'16px' }}>PRINT SHOP</div>
          <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(34px,5vw,58px)', letterSpacing:'0.04em', margin:0, color:'#f4f1ec' }}>Fine Art Prints</h1>
          <p style={{ fontSize:'15px', color:'rgba(244,241,236,0.6)', margin:'18px auto 0', maxWidth:'560px', fontWeight:300 }}>Museum-grade archival prints, produced with a professional lab and shipped worldwide.</p>
        </div>

        {/* Featured hero print */}
        {featured && (
          <div className="nm-lift" style={{ borderRadius:'22px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(16,14,12,0.8)', display:'flex', flexWrap:'wrap', marginBottom:'48px', boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ flex:'1 1 340px', minHeight:'320px', position:'relative', overflow:'hidden' }}>
              <img src={featured.img} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 60%,rgba(16,14,12,0.8))' }} />
              <span style={{ position:'absolute', top:'18px', left:'18px', fontSize:'9px', letterSpacing:'0.18em', padding:'5px 12px', borderRadius:'7px', background:'rgba(200,146,60,0.92)', color:'#1a130a', fontWeight:700 }}>FEATURED</span>
            </div>
            <div style={{ flex:'1 1 300px', padding:'36px 40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:'11px', letterSpacing:'0.26em', color:'#c8923c', marginBottom:'14px' }}>FEATURED PRINT</div>
              <h2 style={{ fontFamily:'var(--font-jost)', fontWeight:300, fontSize:'clamp(24px,3vw,36px)', letterSpacing:'0.04em', margin:'0 0 10px', color:'#f4f1ec' }}>{featured.t}</h2>
              <div style={{ fontSize:'14px', color:'rgba(244,241,236,0.6)', marginBottom:'8px' }}>{featured.loc}</div>
              {featured.ed && <div style={{ fontSize:'13px', color:'rgba(244,241,236,0.45)', marginBottom:'24px' }}>{featured.ed}</div>}
              <div style={{ display:'flex', gap:'28px', marginBottom:'28px', paddingBottom:'24px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                {featured.paper && (
                  <div>
                    <div style={{ fontSize:'10px', letterSpacing:'0.1em', color:'rgba(244,241,236,0.4)', marginBottom:'5px' }}>PAPER</div>
                    <div style={{ fontSize:'13.5px', color:'#f4f1ec' }}>{featured.paper}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize:'10px', letterSpacing:'0.1em', color:'rgba(244,241,236,0.4)', marginBottom:'5px' }}>FROM</div>
                  <div style={{ fontFamily:'var(--font-jost)', fontSize:'28px', color:'#e3b463' }}>${featured.from}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                <a href={featured.externalUrl || storeUrl} target="_blank" rel="noreferrer" className="nm-gold" style={{ padding:'14px 26px', borderRadius:'12px', background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:700, fontSize:'12px', letterSpacing:'0.14em', border:'none', cursor:'pointer', fontFamily:'var(--font-manrope)', textDecoration:'none', display:'inline-block' }}>
                  {featured.externalUrl ? 'BUY THIS PRINT' : 'VISIT STORE'}
                </a>
                <Link href="/contact" className="nm-hl" style={{ padding:'14px 24px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.2)', color:'#f4f1ec', fontSize:'12px', letterSpacing:'0.1em', fontFamily:'var(--font-manrope)' }}>
                  INQUIRE
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Other prints grid */}
        {rest.length > 0 && (
          <>
            {featured && (
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' }}>
                <span style={{ fontSize:'12px', letterSpacing:'0.28em', color:'#c8923c' }}>ALL PRINTS</span>
                <span style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
              </div>
            )}
            <PrintsClient prints={rest} storeUrl={storeUrl} />
          </>
        )}

        {!featured && rest.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px', color:'rgba(244,241,236,0.3)', fontSize:14 }}>
            Add prints in the admin panel → Print Shop tab.
          </div>
        )}

        <div style={{ marginTop:'48px', padding:'20px 24px', borderRadius:'14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>
          <span style={{ fontSize:'13px', color:'rgba(244,241,236,0.55)', flex:1, minWidth:'240px' }}>Your order is fulfilled by a professional lab. High-resolution files are kept private and never shared publicly.</span>
        </div>
      </div>

      <div style={{ padding:'0 0 80px' }}><Footer /></div>
    </div>
  )
}
