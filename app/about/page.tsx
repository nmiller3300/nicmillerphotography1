export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'About — Nic Miller Photography', description: 'Nic Miller is a wildlife and landscape photographer based in Flowery Branch, Georgia.' }

import Link from 'next/link'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'

async function getData() {
  try {
    const [rows, cats, settingsRows, portraitRows] = await Promise.all([
      db.$queryRawUnsafe<Array<{key:string,value:string}>>(`SELECT key, value::text as value FROM site_content WHERE key IN ('aboutBio','portraitUrl')`),
      db.$queryRawUnsafe<Array<{name:string}>>(`SELECT name FROM categories ORDER BY "order" ASC`),
      db.$queryRawUnsafe<Array<{store_url:string,copyright:string,instagram:string,facebook:string}>>(`SELECT store_url, copyright, instagram, facebook FROM settings WHERE id = 1 LIMIT 1`),
      // Fallback: most recent published portrait-orientation photo
      db.$queryRawUnsafe<Array<{url:string}>>(`
        SELECT d.url FROM media m
        JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 960
        WHERE m.status = 'published' AND m.orientation = 'Portrait'
        ORDER BY m.featured DESC, m.created_at DESC LIMIT 1
      `),
    ])
    const c: Record<string,string> = {}
    rows.forEach(r => { c[r.key] = r.value?.replace(/^"|"$/g,'') ?? '' })
    const s = settingsRows[0]
    const portraitUrl = c.portraitUrl || portraitRows[0]?.url || null
    return {
      aboutBio: c.aboutBio || "I'm Nic — a nature, wildlife and landscape photographer. I chase quiet light, honor wild places, and make images with atmosphere and intention.",
      categories: cats.map(c => c.name).filter(Boolean),
      copyright: s?.copyright || '© 2026 Nic Miller Photography. All rights reserved.',
      instagram: s?.instagram || 'nicmiller.photography',
      facebook: s?.facebook || 'nicmiller.photography',
      portraitUrl,
    }
  } catch {
    return { aboutBio:"I'm Nic — a nature, wildlife and landscape photographer.", categories:['Wildlife','Landscapes','Nature','Birds','Aquatic Life'], copyright:'© 2026 Nic Miller Photography. All rights reserved.', instagram:'nicmiller.photography', facebook:'nicmiller.photography', portraitUrl:null }
  }
}

export default async function AboutPage() {
  const data = await getData()
  const portraitImg = data.portraitUrl || '/portrait.jpg'

  return (
    <div style={{ background:'#0b0a09', minHeight:'100vh', color:'#f4f1ec' }}>
      <div style={{ position:'relative', height:'clamp(360px,50vh,540px)', overflow:'hidden', marginTop:'-84px' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url('${portraitImg}')`, backgroundPosition:'center 20%', backgroundSize:'cover', filter:'brightness(0.55) saturate(0.8)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(8,7,6,0.3) 0%, transparent 40%, rgba(8,7,6,0.8) 80%, #0b0a09 100%)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(8,7,6,0.5) 0%, transparent 60%)' }} />
        <div style={{ position:'absolute', bottom:'48px', left:'0', right:'0', maxWidth:'1100px', margin:'0 auto', padding:'0 32px' }}>
          <div style={{ fontSize:'12px', letterSpacing:'0.38em', color:'#c8923c', marginBottom:'14px' }}>ABOUT NIC</div>
          <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(36px,5vw,68px)', letterSpacing:'0.02em', margin:0, lineHeight:1.08, maxWidth:'16ch' }}>Nature,<br/>with intention.</h1>
        </div>
      </div>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'56px 32px 80px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'56px', alignItems:'start' }}>
          <div>
            <div style={{ width:'48px', height:'3px', background:'linear-gradient(90deg,#c8923c,transparent)', marginBottom:'28px' }} />
            <p style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(20px,2.4vw,28px)', lineHeight:1.5, color:'rgba(244,241,236,0.9)', margin:'0 0 30px', letterSpacing:'0.01em' }}>&ldquo;I chase quiet light, honor wild places, and make images that keep giving.&rdquo;</p>
            <p style={{ fontSize:'15.5px', lineHeight:1.85, color:'rgba(244,241,236,0.68)', margin:'0 0 28px', fontWeight:300 }}>{data.aboutBio}</p>
            {data.categories.length > 0 && (
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'32px' }}>
                {data.categories.map(c => <span key={c} style={{ padding:'6px 14px', borderRadius:'8px', background:'rgba(200,146,60,0.1)', border:'1px solid rgba(200,146,60,0.28)', color:'#e3b463', fontSize:'12px', letterSpacing:'0.04em' }}>{c}</span>)}
              </div>
            )}
            <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
              <Link href="/story" className="nm-gold" style={{ display:'inline-flex', alignItems:'center', gap:'11px', padding:'14px 24px', borderRadius:'12px', background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:600, fontSize:'12px', letterSpacing:'0.14em', border:'none', fontFamily:'var(--font-manrope)' }}>READ MY STORY <svg className="nm-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
              <Link href="/contact" className="nm-hl" style={{ padding:'14px 24px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.2)', color:'#f4f1ec', fontSize:'12px', letterSpacing:'0.14em', background:'none', fontFamily:'var(--font-manrope)' }}>GET IN TOUCH</Link>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {[['Based in','Flowery Branch, Georgia'],['Focus','Wildlife, landscapes & natural moments'],['Specialties','Wildlife · Landscapes · Nature · Birds · Aquatic Life']].map(([label,value]) => (
              <div key={label} style={{ padding:'18px 22px', borderRadius:'14px', background:'rgba(20,18,16,0.6)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(16px)' }}>
                <div style={{ fontSize:'10px', letterSpacing:'0.18em', color:'#c8923c', marginBottom:'6px', textTransform:'uppercase' }}>{label}</div>
                <div style={{ fontSize:'14px', color:'rgba(244,241,236,0.85)', lineHeight:1.5 }}>{value}</div>
              </div>
            ))}
            <div style={{ padding:'18px 22px', borderRadius:'14px', background:'rgba(200,146,60,0.07)', border:'1px solid rgba(200,146,60,0.25)' }}>
              <div style={{ fontSize:'10px', letterSpacing:'0.18em', color:'#c8923c', marginBottom:'12px', textTransform:'uppercase' }}>Follow the work</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <a href={`https://instagram.com/${data.instagram}`} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'13px', color:'rgba(244,241,236,0.75)' }}>
                  <span style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none"/></svg></span>
                  @{data.instagram}
                </a>
                {data.facebook && (
                  <a href={`https://facebook.com/${data.facebook}`} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'13px', color:'rgba(244,241,236,0.75)' }}>
                    <span style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#1877F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M14 9h2.6l.4-3H14V4.4c0-.9.25-1.5 1.5-1.5H17V.2C16.7.15 15.8.05 14.8.05 12.4.05 11 1.45 11 4.05V6H8.5v3H11v9h3V9z"/></svg></span>
                    {data.facebook}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer copyright={data.copyright} instagram={data.instagram} facebook={data.facebook} />
    </div>
  )
}
