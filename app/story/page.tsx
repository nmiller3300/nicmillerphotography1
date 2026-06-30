export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'My Story — Nic Miller Photography', description: 'How photography changed the way Nic Miller experiences the world.' }

import Link from 'next/link'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'

const DEFAULT_STORY = [
  "Photography became important to me because it changed how I experience the world.",
  "I am drawn to wildlife because it cannot be controlled. The subject does not pose, wait, or repeat the moment because I missed it. It requires patience, awareness, and a willingness to stay longer than expected.",
  "The photographs on this site are the moments I decided were worth keeping. Some are dramatic. Some are quiet. Together, they show the world as I have experienced it — one frame, one place, and one moment at a time.",
]

async function getData() {
  try {
    const [rows, settingsRows, storyImgRows] = await Promise.all([
      db.$queryRawUnsafe<Array<{key:string,value:string}>>(`SELECT key, value::text as value FROM site_content WHERE key IN ('storyTitle','story','storyImageUrl')`),
      db.$queryRawUnsafe<Array<{copyright:string,instagram:string,facebook:string}>>(`SELECT copyright, instagram, facebook FROM settings WHERE id = 1 LIMIT 1`),
      db.$queryRawUnsafe<Array<{url:string}>>(`
        SELECT d.url FROM media m
        JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 1440
        WHERE m.status = 'published' AND m.featured = true
        ORDER BY m.created_at DESC LIMIT 1
      `),
    ])
    const c: Record<string,unknown> = {}
    rows.forEach(r => { c[r.key] = r.value?.replace(/^"|"$/g,'') ?? '' })
    const s = settingsRows[0]
    const storyImageUrl = (c.storyImageUrl as string) || storyImgRows[0]?.url || null
    let story: string[]
    try { story = JSON.parse(c.story as string) } catch { story = DEFAULT_STORY }
    if (!Array.isArray(story) || !story.length) story = DEFAULT_STORY
    return {
      storyTitle: (c.storyTitle as string) || 'Beyond the Frame',
      story,
      storyImageUrl,
      copyright: s?.copyright || '© 2026 Nic Miller Photography. All rights reserved.',
      instagram: s?.instagram || 'nicmiller.photography',
      facebook: s?.facebook || 'nicmiller.photography',
    }
  } catch {
    return { storyTitle:'Beyond the Frame', story:DEFAULT_STORY, storyImageUrl:null, copyright:'© 2026 Nic Miller Photography. All rights reserved.', instagram:'nicmiller.photography', facebook:'nicmiller.photography' }
  }
}

export default async function StoryPage() {
  const data = await getData()
  const bannerImg = data.storyImageUrl || '/work3.jpg'

  return (
    <div style={{ background:'#0b0a09', minHeight:'100vh' }}>
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'clamp(40px,8vh,90px) 32px 80px', animation:'nmrise .6s ease both' }}>
        <Link href="/about" className="nm-hl" style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(244,241,236,0.6)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-manrope)', marginBottom:30 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
          Back to About
        </Link>
        <div style={{ fontSize:'12px', letterSpacing:'0.34em', color:'#c8923c', marginBottom:'18px' }}>MY STORY</div>
        <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(32px,4.6vw,56px)', letterSpacing:'0.03em', margin:'0 0 14px', lineHeight:1.1, color:'#f4f1ec' }}>{data.storyTitle}</h1>
        <div style={{ width:'60px', height:'2px', background:'linear-gradient(90deg,#c8923c,transparent)', marginBottom:'38px' }} />
        <div style={{ borderRadius:'18px', overflow:'hidden', aspectRatio:'16/9', marginBottom:'38px', backgroundImage:`url('${bannerImg}')`, backgroundSize:'cover', backgroundPosition:'center', border:'1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ display:'flex', flexDirection:'column', gap:'22px' }}>
          {data.story.map((para: string, i: number) => (
            <p key={i} style={{ fontSize:'17px', lineHeight:1.85, color:'rgba(244,241,236,0.78)', fontWeight:300, margin:0 }}>{para}</p>
          ))}
        </div>
        <div style={{ marginTop:'44px', paddingTop:'30px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:'14px', flexWrap:'wrap' }}>
          <Link href="/portfolio" className="nm-gold" style={{ padding:'14px 24px', borderRadius:'12px', background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:600, fontSize:'12px', letterSpacing:'0.14em', border:'none', fontFamily:'var(--font-manrope)' }}>VIEW THE PORTFOLIO</Link>
          <Link href="/contact" className="nm-hl" style={{ padding:'14px 24px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.25)', color:'#f4f1ec', fontSize:'12px', letterSpacing:'0.14em', background:'none', fontFamily:'var(--font-manrope)' }}>GET IN TOUCH</Link>
        </div>
      </div>
      <Footer copyright={data.copyright} instagram={data.instagram} facebook={data.facebook} />
    </div>
  )
}
