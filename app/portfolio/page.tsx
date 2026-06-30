export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Portfolio — Nic Miller Photography', description: 'Wildlife, landscapes, and natural moments photographed with atmosphere and intention.' }

import Link from 'next/link'
import Footer from '@/components/Footer'
import PortfolioClient from '@/components/PortfolioClient'
import { db } from '@/lib/db'

async function getData() {
  try {
    const [cats, series, media] = await Promise.all([
      db.$queryRawUnsafe<Array<{name:string}>>(`SELECT name FROM categories ORDER BY "order" ASC`),
      // Published series with cover + count
      db.$queryRawUnsafe<Array<{id:number,title:string,slug:string,cover_url:string,count:number}>>(`
        SELECT c.id, c.title, c.slug, cov.url as cover_url,
               COUNT(ci.media_id)::int as count
        FROM collections c
        LEFT JOIN derivatives cov ON cov.media_id = c.cover_media_id AND cov.format='webp' AND cov.width=960
        LEFT JOIN collection_items ci ON ci.collection_id = c.id
        WHERE c.published = true
        GROUP BY c.id, cov.url
        HAVING COUNT(ci.media_id) > 0
        ORDER BY c."order" ASC, c.id ASC
      `),
      // Loose photos — published, NOT part of any collection, ordered manually
      db.$queryRawUnsafe<Array<{id:number,title:string,location:string,thumb_url:string,display_url:string,category:string,aspect:number}>>(`
        SELECT m.id, m.title, m.location,
               thumb.url as thumb_url, disp.url as display_url,
               c.name as category, m.aspect
        FROM media m
        LEFT JOIN derivatives thumb ON thumb.media_id = m.id AND thumb.format = 'webp' AND thumb.width = 960
        LEFT JOIN derivatives disp  ON disp.media_id  = m.id AND disp.format  = 'webp' AND disp.width  = 1440
        LEFT JOIN categories c ON c.id = m.category_id
        WHERE m.status = 'published'
          AND m.id NOT IN (SELECT media_id FROM collection_items)
        ORDER BY m.sort_order ASC, m.featured DESC, m.created_at DESC
      `),
    ])
    const gallery = media.filter(m => m.thumb_url).map(m => ({
      id: m.id, t: m.title, loc: m.location||'', cat: m.category||'Wildlife',
      img: m.thumb_url, fullImg: m.display_url||m.thumb_url, aspect: m.aspect||1.5,
    }))
    const collections = series.filter(s => s.cover_url).map(s => ({
      title: s.title, slug: s.slug, cover: s.cover_url, count: s.count,
    }))
    const categories = cats.map(c => c.name)
    return { gallery, collections, categories: categories.length > 0 ? categories : ['Wildlife','Landscapes','Nature','Birds','Aquatic Life'] }
  } catch {
    return { gallery: [], collections: [], categories: ['Wildlife','Landscapes','Nature','Birds','Aquatic Life'] }
  }
}

export default async function PortfolioPage() {
  const { gallery, collections, categories } = await getData()
  return (
    <div style={{ background:'#0b0a09', minHeight:'100vh' }}>
      <div style={{ maxWidth:'1320px', margin:'0 auto', padding:'clamp(40px,8vh,90px) 28px 80px', animation:'nmrise .6s ease both' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ fontSize:'12px', letterSpacing:'0.34em', color:'#c8923c', marginBottom:'16px' }}>PORTFOLIO</div>
          <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(34px,5vw,58px)', letterSpacing:'0.04em', margin:0, color:'#f4f1ec' }}>Collected Works</h1>
          <p style={{ fontSize:'15px', color:'rgba(244,241,236,0.6)', margin:'18px auto 0', maxWidth:'520px', fontWeight:300 }}>Wildlife, landscapes, and quiet natural moments — gathered by series.</p>
        </div>

        {/* Series row */}
        {collections.length > 0 && (
          <div style={{ marginBottom:'48px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px' }}>
              <span style={{ fontSize:'12px', letterSpacing:'0.28em', color:'#c8923c' }}>SERIES</span>
              <span style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'16px' }}>
              {collections.map(s => (
                <Link key={s.slug} href={`/collections/${s.slug}`} className="nm-lift nm-tw" style={{ position:'relative', borderRadius:'16px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', aspectRatio:'3/2', display:'block', background:'#12100e' }}>
                  <div className="nm-thumb" style={{ position:'absolute', inset:0, backgroundImage:`url('${s.cover}')`, backgroundSize:'cover', backgroundPosition:'center' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.1) 30%,rgba(0,0,0,0.78))' }} />
                  <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:'20px' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'10px', letterSpacing:'0.14em', color:'#e3b463', marginBottom:'8px', padding:'3px 10px', borderRadius:'6px', background:'rgba(8,7,6,0.6)', border:'1px solid rgba(200,146,60,0.3)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                      {s.count} PHOTOS
                    </div>
                    <div style={{ fontFamily:'var(--font-jost)', fontSize:'22px', color:'#f4f1ec', fontWeight:300 }}>{s.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Loose photos */}
        {gallery.length > 0 && collections.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px' }}>
            <span style={{ fontSize:'12px', letterSpacing:'0.28em', color:'#c8923c' }}>ALL WORK</span>
            <span style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
          </div>
        )}
        <PortfolioClient gallery={gallery} categories={categories} />
      </div>
      <Footer />
    </div>
  )
}
