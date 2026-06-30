export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import PhotoDetailClient from '@/components/PhotoDetailClient'
import { db } from '@/lib/db'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const rows = await db.$queryRawUnsafe<Array<{title:string,location:string|null,caption:string|null}>>(
      `SELECT title, location, caption FROM media WHERE id = ${parseInt(id)} AND status = 'published' LIMIT 1`
    )
    if (!rows.length) return { title: 'Photo — Nic Miller Photography' }
    const p = rows[0]
    const title = `${p.title}${p.location ? ` — ${p.location}` : ''} | Nic Miller Photography`
    const description = p.caption || `Wildlife and landscape photography by Nic Miller.`
    return { title, description }
  } catch { return { title: 'Photo — Nic Miller Photography' } }
}

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mediaId = parseInt(id)
  if (isNaN(mediaId)) notFound()

  try {
    const rows = await db.$queryRawUnsafe<Array<{
      id: number; title: string; location: string|null; caption: string|null
      description: string|null; camera: string|null; capture_date: string|null
      status: string; print_enabled: boolean; orientation: string|null
      thumb_url: string|null; display_url: string|null
      print_title: string|null; print_from: number|null; print_url: string|null; store_url: string|null
    }>>(`
      SELECT m.id, m.title, m.location, m.caption, m.description, m.camera, m.capture_date,
             m.status, m.print_enabled, m.orientation,
             thumb.url as thumb_url,
             disp.url as display_url,
             p.title as print_title, p.from_price as print_from,
             COALESCE(p.external_url, s.store_url) as print_url,
             s.store_url
      FROM media m
      LEFT JOIN derivatives thumb ON thumb.media_id = m.id AND thumb.format = 'webp' AND thumb.width = 960
      LEFT JOIN derivatives disp  ON disp.media_id  = m.id AND disp.format  = 'webp' AND disp.width  = 1440
      LEFT JOIN prints p ON p.media_id = m.id AND p.published = true
      LEFT JOIN settings s ON s.id = 1
      WHERE m.id = ${mediaId} AND m.status = 'published'
      LIMIT 1
    `)

    if (!rows.length) notFound()
    const photo = rows[0]

    // Prev / next — navigate by sort_order, not id
    const nav = await db.$queryRawUnsafe<Array<{id:number,title:string,dir:string}>>(`
      SELECT id, title, 'prev' as dir FROM media
      WHERE status='published' AND sort_order < (SELECT sort_order FROM media WHERE id=${mediaId})
      ORDER BY sort_order DESC LIMIT 1
      UNION ALL
      SELECT id, title, 'next' as dir FROM media
      WHERE status='published' AND sort_order > (SELECT sort_order FROM media WHERE id=${mediaId})
      ORDER BY sort_order ASC LIMIT 1
    `)
    const prev = nav.find(n => n.dir === 'prev') || null
    const next = nav.find(n => n.dir === 'next') || null

    return (
      <div style={{ background:'#0b0a09', minHeight:'100vh', color:'#f4f1ec' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'clamp(28px,6vh,60px) 28px 80px', animation:'nmrise .5s ease both' }}>

          {/* Breadcrumb */}
          <Link href="/portfolio" style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(244,241,236,0.5)', marginBottom:28, fontFamily:'var(--font-manrope)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
            Back to Portfolio
          </Link>

          {/* The photo — zoom-capable client component */}
          <PhotoDetailClient
            thumbUrl={photo.thumb_url}
            displayUrl={photo.display_url || photo.thumb_url}
            title={photo.title}
            orientation={photo.orientation}
          />

          {/* Metadata */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:32, marginTop:36 }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(26px,4vw,42px)', letterSpacing:'0.02em', margin:'0 0 10px', color:'#f4f1ec' }}>{photo.title}</h1>
              <div style={{ display:'flex', gap:18, flexWrap:'wrap', marginBottom:18 }}>
                {photo.location && (
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(244,241,236,0.6)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.7"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {photo.location}
                  </span>
                )}
                {photo.capture_date && (
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(244,241,236,0.6)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.7"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    {photo.capture_date}
                  </span>
                )}
                {photo.camera && (
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(244,241,236,0.6)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.7"><rect x="3" y="7" width="18" height="14" rx="2"/><circle cx="12" cy="14" r="3.5"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
                    {photo.camera}
                  </span>
                )}
              </div>
              {photo.caption && <p style={{ fontSize:15, lineHeight:1.7, color:'rgba(244,241,236,0.7)', margin:'0 0 14px', fontStyle:'italic' }}>{photo.caption}</p>}
              {photo.description && <p style={{ fontSize:14.5, lineHeight:1.8, color:'rgba(244,241,236,0.6)', margin:0 }}>{photo.description}</p>}
            </div>

            {/* Print CTA */}
            {photo.print_enabled && (
              <div style={{ padding:24, borderRadius:16, border:'1px solid rgba(200,146,60,0.3)', background:'rgba(200,146,60,0.06)', display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:11, letterSpacing:'0.22em', color:'#c8923c' }}>AVAILABLE AS FINE ART PRINT</div>
                <div style={{ fontFamily:'var(--font-jost)', fontSize:20, color:'#f4f1ec' }}>{photo.print_title || photo.title}</div>
                {photo.print_from && <div style={{ fontSize:12, letterSpacing:'0.1em', color:'rgba(244,241,236,0.5)' }}>FROM <span style={{ fontFamily:'var(--font-jost)', fontSize:26, color:'#e3b463', letterSpacing:0 }}> ${photo.print_from}</span></div>}
                <a
                  href={photo.print_url || photo.store_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="nm-gold"
                  style={{ padding:'13px 22px', borderRadius:12, background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:700, fontSize:12, letterSpacing:'0.14em', textDecoration:'none', display:'inline-block', textAlign:'center', border:'none', fontFamily:'var(--font-manrope)' }}
                >
                  ORDER PRINT →
                </a>
                <Link href="/prints" style={{ fontSize:12, color:'rgba(244,241,236,0.45)', textAlign:'center' }}>View all prints</Link>
              </div>
            )}
          </div>

          {/* Prev / Next */}
          <div style={{ display:'flex', justifyContent:'space-between', gap:16, marginTop:52, paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            {prev ? (
              <Link href={`/photos/${prev.id}`} className="nm-hl" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(244,241,236,0.55)', fontFamily:'var(--font-manrope)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
                {prev.title}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/photos/${next.id}`} className="nm-hl" style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(244,241,236,0.55)', fontFamily:'var(--font-manrope)' }}>
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
