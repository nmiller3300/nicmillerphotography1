export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'

const DEFAULT_STORY = [
  "I didn't start with a camera so much as a restlessness — a need to be out before dawn, where the light is still deciding what kind of day it wants to be.",
  "Wildlife taught me patience; landscapes taught me humility. Most of my favorite frames came after hours of waiting, when I'd almost convinced myself nothing would happen. Then it did.",
  "I don't manufacture drama in post. What you see is what was there — atmosphere, weather, and a little luck, held steady long enough to keep. My hope is that a print brings a piece of that wildness into the rooms where you live.",
]

async function getData() {
  try {
    const rows = await db.siteContent.findMany({ where: { key: { in: ['storyTitle', 'story'] } } })
    const c = Object.fromEntries(rows.map((r: {key:string,value:unknown}) => [r.key, r.value]))
    return {
      storyTitle: (c.storyTitle as string) ?? 'Beyond the Frame',
      story: (c.story as string[]) ?? DEFAULT_STORY,
    }
  } catch {
    return { storyTitle: 'Beyond the Frame', story: DEFAULT_STORY }
  }
}

export default async function StoryPage() {
  const { storyTitle, story } = await getData()
  return (
    <div style={{ background: '#0b0a09', minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(40px,8vh,90px) 32px 80px', animation: 'nmrise .6s ease both' }}>
        <Link href="/about" className="nm-hl" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(244,241,236,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', marginBottom: '30px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg> Back to About
        </Link>
        <div style={{ fontSize: '12px', letterSpacing: '0.34em', color: '#c8923c', marginBottom: '18px' }}>MY&nbsp;STORY</div>
        <h1 style={{ fontFamily: 'var(--font-jost)', fontWeight: 200, fontSize: 'clamp(32px,4.6vw,56px)', letterSpacing: '0.03em', margin: '0 0 14px', lineHeight: 1.1, color: '#f4f1ec' }}>{storyTitle}</h1>
        <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg,#c8923c,transparent)', marginBottom: '38px' }}></div>
        <div style={{ borderRadius: '18px', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '38px', background: "url('/work3.jpg') center/cover", border: '1px solid rgba(255,255,255,0.08)' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {story.map((para: string, i: number) => (
            <p key={i} style={{ fontSize: '17px', lineHeight: 1.85, color: 'rgba(244,241,236,0.78)', fontWeight: 300, margin: 0 }}>{para}</p>
          ))}
        </div>
        <div style={{ marginTop: '44px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Link href="/portfolio" className="nm-gold" style={{ padding: '14px 24px', borderRadius: '12px', background: 'linear-gradient(180deg,#d49a40,#b07c2e)', color: '#1a130a', fontWeight: 600, fontSize: '12px', letterSpacing: '0.14em', border: 'none', fontFamily: 'var(--font-manrope)' }}>
            VIEW&nbsp;THE&nbsp;PORTFOLIO
          </Link>
          <Link href="/contact" className="nm-hl" style={{ padding: '14px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.25)', color: '#f4f1ec', fontSize: '12px', letterSpacing: '0.14em', background: 'none', fontFamily: 'var(--font-manrope)' }}>
            WORK&nbsp;WITH&nbsp;ME
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
