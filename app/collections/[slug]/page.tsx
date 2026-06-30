export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import PortfolioClient from '@/components/PortfolioClient'
import { db } from '@/lib/db'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const rows = await db.$queryRawUnsafe<Array<{title:string,description:string|null}>>(
      `SELECT title, description FROM collections WHERE slug = '${slug.replace(/'/g,"''")}' AND published = true LIMIT 1`
    )
    if (!rows.length) return { title: 'Series — Nic Miller Photography' }
    const c = rows[0]
    return {
      title: `${c.title} Series — Nic Miller Photography`,
      description: c.description || `A photo series by Nic Miller.`,
    }
  } catch { return { title: 'Series — Nic Miller Photography' } }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const colRows = await db.$queryRawUnsafe<Array<{id:number,title:string,description:string|null}>>(
      `SELECT id, title, description FROM collections WHERE slug = '${slug.replace(/'/g,"''")}' AND published = true LIMIT 1`
    )
    if (!colRows.length) notFound()
    const col = colRows[0]

    const media = await db.$queryRawUnsafe<Array<{id:number,title:string,location:string,thumb_url:string,display_url:string,category:string,aspect:number}>>(`
      SELECT m.id, m.title, m.location,
             thumb.url as thumb_url, disp.url as display_url,
             c.name as category, m.aspect
      FROM collection_items ci
      JOIN media m ON m.id = ci.media_id
      LEFT JOIN derivatives thumb ON thumb.media_id = m.id AND thumb.format='webp' AND thumb.width=960
      LEFT JOIN derivatives disp  ON disp.media_id  = m.id AND disp.format='webp' AND disp.width=1440
      LEFT JOIN categories c ON c.id = m.category_id
      WHERE ci.collection_id = ${col.id} AND m.status = 'published'
      ORDER BY ci."order" ASC
    `)

    const gallery = media.filter(m => m.thumb_url).map(m => ({
      id: m.id, t: m.title, loc: m.location||'', cat: m.category||'Series',
      img: m.thumb_url, fullImg: m.display_url||m.thumb_url, aspect: m.aspect||1.5,
    }))

    return (
      <div style={{ background:'#0b0a09', minHeight:'100vh' }}>
        <div style={{ maxWidth:'1320px', margin:'0 auto', padding:'clamp(40px,8vh,90px) 28px 80px', animation:'nmrise .6s ease both' }}>
          <Link href="/portfolio" style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(244,241,236,0.5)', marginBottom:28, fontFamily:'var(--font-manrope)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
            Back to Portfolio
          </Link>
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <div style={{ fontSize:'12px', letterSpacing:'0.34em', color:'#c8923c', marginBottom:'16px' }}>SERIES</div>
            <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(34px,5vw,58px)', letterSpacing:'0.04em', margin:0, color:'#f4f1ec' }}>{col.title}</h1>
            {col.description && <p style={{ fontSize:'15px', color:'rgba(244,241,236,0.6)', margin:'18px auto 0', maxWidth:'600px', fontWeight:300, lineHeight:1.7 }}>{col.description}</p>}
          </div>
          <PortfolioClient gallery={gallery} categories={[]} />
        </div>
        <Footer />
      </div>
    )
  } catch {
    notFound()
  }
}
