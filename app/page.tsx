export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Footer from '@/components/Footer'
import HomeClient from '@/components/HomeClient'
import { db } from '@/lib/db'

const D = {
  heroEyebrow:'BEYOND THE FRAME.', heroTitle:'A Different Way of Seeing Beauty.',
  heroSubtitle:'Wildlife, landscapes, and natural moments\nphotographed with atmosphere and intention.',
  aboutBio:"I'm Nic — a nature, wildlife and landscape photographer.",
  storeUrl:'https://nicmillerphotography.pixieset.com',
  copyright:'© 2026 Nic Miller Photography. All rights reserved.',
}

async function getData() {
  try {
    const [contentRows, settingsRows, recentRows, heroRows, featuredPrintRows] = await Promise.all([
      db.$queryRawUnsafe<Array<{key:string,value:string}>>(
        `SELECT key, value::text as value FROM site_content WHERE key IN ('heroEyebrow','heroTitle','heroSubtitle','aboutBio','portraitUrl')`
      ),
      db.$queryRawUnsafe<Array<{store_url:string,copyright:string,instagram:string,facebook:string}>>(
        `SELECT store_url, copyright, instagram, facebook FROM settings WHERE id = 1 LIMIT 1`
      ),
      db.$queryRawUnsafe<Array<{id:number,title:string,location:string,thumb_url:string}>>(`
        SELECT m.id, m.title, m.location, d.url as thumb_url
        FROM media m
        LEFT JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 960
        WHERE m.status = 'published'
        ORDER BY m.sort_order ASC, m.featured DESC, m.created_at DESC LIMIT 6
      `),
      db.$queryRawUnsafe<Array<{url:string}>>(`
        SELECT d.url FROM media m
        JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 1440
        WHERE m.status = 'published' AND m.homepage = true
        ORDER BY m.created_at DESC LIMIT 1
      `),
      // Fetch all fields including id, edition, paper so nothing on the page is hardcoded
      db.$queryRawUnsafe<Array<{id:number,title:string,location:string,from_price:number,external_url:string,thumb_url:string,edition:string|null,paper:string|null}>>(`
        SELECT p.id, p.title, p.location, p.from_price, p.external_url,
               p.edition, p.paper,
               d.url as thumb_url
        FROM prints p
        LEFT JOIN media m ON m.id = p.media_id
        LEFT JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 960
        WHERE p.featured = true AND p.published = true
        ORDER BY p.id DESC LIMIT 1
      `),
    ])
    const c: Record<string,string> = {}
    contentRows.forEach(r => { c[r.key] = r.value?.replace(/^"|"$/g,'') ?? '' })
    const s = settingsRows[0]
    const heroUrl = heroRows[0]?.url || null
    const fp = featuredPrintRows[0] || null
    const gallery = recentRows.filter(m => m.thumb_url).map(m => ({ id:m.id, t:m.title, loc:m.location||'', cat:'Wildlife', img:m.thumb_url }))
    return {
      heroEyebrow: c.heroEyebrow||D.heroEyebrow, heroTitle:c.heroTitle||D.heroTitle,
      heroSubtitle:c.heroSubtitle||D.heroSubtitle, aboutBio:c.aboutBio||D.aboutBio,
      storeUrl:s?.store_url||D.storeUrl, copyright:s?.copyright||D.copyright,
      instagram:s?.instagram||'nicmiller.photography', facebook:s?.facebook||'nicmiller.photography',
      heroUrl, gallery, portraitUrl: c.portraitUrl || null,
      featuredPrint: fp ? {
        id: fp.id,
        title: fp.title,
        location: fp.location || '',
        from: fp.from_price || 0,
        img: fp.thumb_url || '/featured.jpg',
        href: fp.external_url || s?.store_url || '#',
        edition: fp.edition || null,
        paper: fp.paper || null,
      } : null,
    }
  } catch {
    return { ...D, heroUrl:null, gallery:[], featuredPrint:null, instagram:'nicmiller.photography', facebook:'nicmiller.photography', portraitUrl:null }
  }
}

export default async function HomePage() {
  const data = await getData()
  const heroImg = data.heroUrl || '/hero-clean.jpg'
  const fp = data.featuredPrint
  const printHref = fp ? (fp.id ? `/prints/${fp.id}` : fp.href) : '/prints'

  return (
    <div style={{ position:'relative', width:'100%', overflowX:'hidden', background:'#0b0a09' }}>

      {/* ── HERO ── clean, no overlay card */}
      <header style={{ position:'relative', marginTop:'-84px', minHeight:'clamp(620px, 76vh, 880px)', display:'flex', alignItems:'center', overflow:'hidden', background:'#0b0a09' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <img src={heroImg} alt="" style={{ position:'absolute', top:'-4%', left:'-4%', width:'108%', height:'108%', objectFit:'cover', objectPosition:'center 32%', animation:'nmken 26s ease-in-out infinite' }} />
        </div>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(7,6,5,0.95) 0%, rgba(7,6,5,0.66) 30%, rgba(7,6,5,0.12) 56%, transparent 76%)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(7,6,5,0.4) 0%, transparent 28%, transparent 66%, rgba(7,6,5,0.66) 100%)' }} />
        <div style={{ position:'relative', zIndex:3, width:'100%', maxWidth:'1264px', margin:'0 auto', padding:'104px 32px 64px' }}>
          <div style={{ maxWidth:'600px', animation:'nmrise .9s cubic-bezier(.2,.7,.2,1) both' }}>
            <div style={{ fontSize:'13px', letterSpacing:'0.42em', color:'#c8923c', marginBottom:'22px' }}>{data.heroEyebrow}</div>
            <h1 style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:'clamp(38px, 5.6vw, 74px)', lineHeight:1.08, letterSpacing:'0.01em', margin:'0 0 26px', maxWidth:'14ch', textShadow:'0 4px 40px rgba(0,0,0,0.6)', color:'#f4f1ec' }}>{data.heroTitle}</h1>
            <p style={{ fontSize:'clamp(15px,1.4vw,18px)', lineHeight:1.7, color:'rgba(244,241,236,0.8)', maxWidth:'440px', margin:'0 0 38px', fontWeight:300, whiteSpace:'pre-line' }}>{data.heroSubtitle}</p>
            <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
              <Link href="/portfolio" className="nm-gold nm-link" style={{ display:'inline-flex', alignItems:'center', gap:'12px', padding:'15px 26px', borderRadius:'12px', background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:600, fontSize:'12.5px', letterSpacing:'0.16em', border:'none', fontFamily:"'Manrope'" }}>
                EXPLORE&nbsp;PORTFOLIO <svg className="nm-arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
              <Link href="/prints" className="nm-hl nm-link" style={{ display:'inline-flex', alignItems:'center', gap:'12px', padding:'15px 26px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.3)', color:'#f4f1ec', fontWeight:500, fontSize:'12.5px', letterSpacing:'0.16em', background:'none', fontFamily:"'Manrope'" }}>
                VISIT&nbsp;PRINT&nbsp;SHOP
              </Link>
            </div>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:'20px', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', zIndex:3, animation:'nmpulse 2.4s ease-in-out infinite' }}>
          <span style={{ fontSize:'9px', letterSpacing:'0.3em', color:'rgba(244,241,236,0.5)' }}>SCROLL</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.6"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
        </div>
      </header>

      {/* ── PRINT SHOP BAND ── only renders if a print is featured + live */}
      {fp && (
        <section style={{ background:'#0b0a09', padding:'clamp(56px,7vw,96px) 0', position:'relative' }}>
          <div style={{ position:'absolute', top:0, right:0, width:'50%', height:'100%', background:'radial-gradient(60% 80% at 80% 50%, rgba(200,146,60,0.07), transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', maxWidth:'1264px', margin:'0 auto', padding:'0 32px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:'clamp(28px,4vw,56px)', alignItems:'center' }}>
            <div style={{ maxWidth:'400px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' }}>
                <span style={{ fontSize:'12px', letterSpacing:'0.28em', color:'#c8923c' }}>PRINT&nbsp;SHOP</span>
                <span style={{ width:'46px', height:'1px', background:'rgba(200,146,60,0.5)' }} />
              </div>
              <h2 style={{ fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:'clamp(28px,3.2vw,42px)', lineHeight:1.14, letterSpacing:'0.05em', margin:'0 0 22px', color:'#f4f1ec' }}>MUSEUM&nbsp;QUALITY.<br/>MADE&nbsp;TO&nbsp;LAST.</h2>
              <p style={{ fontSize:'15px', lineHeight:1.7, color:'rgba(244,241,236,0.6)', margin:'0 0 28px', fontWeight:300 }}>Archival fine art prints crafted with the world&#39;s best materials and attention to detail.</p>
              <Link href="/prints" className="nm-hl nm-link" style={{ display:'inline-flex', alignItems:'center', gap:'11px', fontSize:'12px', letterSpacing:'0.2em', color:'#e3b463', padding:'0 0 7px', background:'none', border:'none', fontFamily:"'Manrope'" }}>
                EXPLORE&nbsp;PRINT&nbsp;SHOP <svg className="nm-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </div>
            <div className="nm-lift" style={{ minWidth:0, borderRadius:'20px', overflow:'hidden', background:'linear-gradient(135deg, rgba(26,21,15,0.9), rgba(13,11,10,0.85))', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 60px rgba(0,0,0,0.5)', display:'flex', flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:'1 1 240px', minHeight:'240px', background:`#100d0a url('${fp.img}') center/cover no-repeat` }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(120deg, transparent 60%, rgba(13,11,10,0.6))' }} />
              </div>
              <div style={{ flex:'1 1 280px', minWidth:0, padding:'28px 30px' }}>
                <div style={{ fontSize:'11px', letterSpacing:'0.26em', color:'#c8923c', marginBottom:'12px' }}>FEATURED&nbsp;PRINT</div>
                <h3 style={{ fontFamily:"'Jost'", fontWeight:400, fontSize:'clamp(20px,2vw,27px)', letterSpacing:'0.04em', margin:'0 0 10px', color:'#f4f1ec' }}>{fp.title.toUpperCase()}</h3>
                {fp.location && <div style={{ fontSize:'13.5px', color:'rgba(244,241,236,0.72)', marginBottom:'4px' }}>{fp.location}</div>}
                {fp.edition && <div style={{ fontSize:'13px', color:'rgba(244,241,236,0.5)', paddingBottom:'16px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>{fp.edition}</div>}
                {(fp.edition || fp.paper) && (
                  <div style={{ display:'flex', gap:'24px', flexWrap:'wrap', margin:'16px 0 22px' }}>
                    {fp.edition && <div><div style={{ fontSize:'10.5px', letterSpacing:'0.08em', color:'rgba(244,241,236,0.45)', marginBottom:'5px' }}>EDITION</div><div style={{ fontSize:'13.5px', color:'#f4f1ec' }}>{fp.edition}</div></div>}
                    {fp.paper  && <div><div style={{ fontSize:'10.5px', letterSpacing:'0.08em', color:'rgba(244,241,236,0.45)', marginBottom:'5px' }}>PAPER</div><div style={{ fontSize:'13.5px', color:'#f4f1ec' }}>{fp.paper}</div></div>}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginTop: (fp.edition || fp.paper) ? 0 : '22px' }}>
                  <Link href={printHref} className="nm-hl nm-link" style={{ display:'inline-flex', alignItems:'center', gap:'11px', padding:'13px 22px', borderRadius:'11px', border:'1px solid rgba(200,146,60,0.5)', fontSize:'11px', letterSpacing:'0.18em', color:'#e3b463', background:'none', fontFamily:"'Manrope'" }}>
                    VIEW&nbsp;PRINT <svg className="nm-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </Link>
                  <div style={{ fontSize:'11px', letterSpacing:'0.16em', color:'rgba(244,241,236,0.5)' }}>FROM <span style={{ fontFamily:"'Jost'", fontSize:'22px', color:'#e3b463', letterSpacing:0, marginLeft:'4px' }}>${fp.from}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── RECENT WORK + ABOUT ── */}
      <section style={{ background:'#0b0a09', padding:`${fp?'0':'clamp(56px,7vw,90px)'} 0 clamp(56px,7vw,90px)` }}>
        <div style={{ maxWidth:'1264px', margin:'0 auto', padding:'0 32px', display:'flex', flexDirection:'column', gap:'46px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                <span style={{ fontSize:'12px', letterSpacing:'0.28em', color:'#c8923c' }}>RECENT&nbsp;WORK</span>
                <span style={{ width:'46px', height:'1px', background:'rgba(200,146,60,0.5)' }} />
              </div>
              <Link href="/portfolio" className="nm-hl nm-link" style={{ display:'inline-flex', alignItems:'center', gap:'10px', fontSize:'11.5px', letterSpacing:'0.18em', color:'rgba(244,241,236,0.7)', background:'none', border:'none', fontFamily:"'Manrope'" }}>
                VIEW&nbsp;FULL&nbsp;PORTFOLIO <svg className="nm-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </div>
            {data.gallery.length > 0 ? (
              <HomeClient gallery={data.gallery} />
            ) : (
              <div style={{ padding:'48px 0', textAlign:'center', color:'rgba(244,241,236,0.25)', fontSize:13.5 }}>
                Publish photos in the admin to see them here.
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:'28px', alignItems:'center', flexWrap:'wrap', paddingTop:'34px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ flex:'0 0 150px', width:'150px', aspectRatio:'3/4', borderRadius:'14px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', background:`url('${data.portraitUrl || '/portrait.jpg'}') center/cover` }} />
            <div style={{ flex:'1 1 320px', minWidth:'260px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                <span style={{ fontSize:'12px', letterSpacing:'0.28em', color:'#c8923c' }}>ABOUT&nbsp;NIC</span>
                <span style={{ width:'34px', height:'1px', background:'rgba(200,146,60,0.5)' }} />
              </div>
              <p style={{ fontSize:'15px', lineHeight:1.8, color:'rgba(244,241,236,0.74)', margin:'0 0 22px', fontWeight:300, maxWidth:'560px' }}>{data.aboutBio}</p>
              <Link href="/story" className="nm-hl nm-link" style={{ display:'inline-flex', alignItems:'center', gap:'10px', fontSize:'11.5px', letterSpacing:'0.18em', color:'#e3b463', background:'none', border:'none', fontFamily:"'Manrope'" }}>
                READ&nbsp;MY&nbsp;STORY <svg className="nm-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer copyright={data.copyright} instagram={data.instagram} facebook={data.facebook} />
    </div>
  )
}
