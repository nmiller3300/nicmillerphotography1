export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { db } from '@/lib/db'

async function getData() {
  try {
    const [rows, cats] = await Promise.all([
      db.siteContent.findMany({ where: { key: { in: ['aboutBio'] } } }),
      db.category.findMany({ orderBy: { order: 'asc' } }),
    ])
    const c = Object.fromEntries(rows.map((r: {key:string,value:unknown}) => [r.key, r.value as string]))
    return {
      aboutBio: c.aboutBio ?? "I'm Nic — a nature, wildlife and landscape photographer. I chase quiet light, honor wild places, and make images with atmosphere and intention, built to live on a wall and keep giving.",
      categories: cats.length > 0 ? cats.map(c => c.name) : ['Wildlife','Landscapes','Nature','Birds','Aquatic Life'],
    }
  } catch {
    return {
      aboutBio: "I'm Nic — a nature, wildlife and landscape photographer. I chase quiet light, honor wild places, and make images with atmosphere and intention, built to live on a wall and keep giving.",
      categories: ['Wildlife','Landscapes','Nature','Birds','Aquatic Life'],
    }
  }
}

export default async function AboutPage() {
  const { aboutBio, categories } = await getData()
  return (
    <div style={{ background: '#0b0a09', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(40px,8vh,90px) 32px 80px', animation: 'nmrise .6s ease both' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ borderRadius: '20px', overflow: 'hidden', aspectRatio: '4/5', border: '1px solid rgba(255,255,255,0.1)', background: "url('/portrait.jpg') center/cover", boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}></div>
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '0.34em', color: '#c8923c', marginBottom: '16px' }}>ABOUT&nbsp;NIC</div>
            <h1 style={{ fontFamily: 'var(--font-jost)', fontWeight: 200, fontSize: 'clamp(30px,4vw,50px)', letterSpacing: '0.03em', margin: '0 0 22px', color: '#f4f1ec' }}>Nature, with intention.</h1>
            <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'rgba(244,241,236,0.75)', fontWeight: 300, margin: '0 0 22px' }}>{aboutBio}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
              {categories.map(c => (
                <span key={c} style={{ padding: '7px 14px', borderRadius: '9px', background: 'rgba(200,146,60,0.12)', border: '1px solid rgba(200,146,60,0.3)', color: '#e3b463', fontSize: '12px' }}>{c}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/story" className="nm-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '11px', padding: '14px 24px', borderRadius: '12px', background: 'linear-gradient(180deg,#d49a40,#b07c2e)', color: '#1a130a', fontWeight: 600, fontSize: '12px', letterSpacing: '0.14em', border: 'none', fontFamily: 'var(--font-manrope)' }}>
                READ&nbsp;MY&nbsp;STORY <svg className="nm-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
              <Link href="/contact" className="nm-hl" style={{ padding: '14px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.25)', color: '#f4f1ec', fontSize: '12px', letterSpacing: '0.14em', background: 'none', fontFamily: 'var(--font-manrope)' }}>
                GET&nbsp;IN&nbsp;TOUCH
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
