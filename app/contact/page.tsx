export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Contact — Nic Miller Photography', description: 'Get in touch for print enquiries, licensing, or just to talk photography.' }

import Footer from '@/components/Footer'
import ContactClient from '@/components/ContactClient'
import { db } from '@/lib/db'

async function getSettings() {
  try {
    const rows = await db.$queryRawUnsafe<Array<{email:string,instagram:string,facebook:string,copyright:string}>>(
      `SELECT email, instagram, facebook, copyright FROM settings WHERE id = 1 LIMIT 1`
    )
    const s = rows[0]
    return {
      email: s?.email || 'nmiller3300@gmail.com',
      instagram: s?.instagram || 'nicmiller.photography',
      facebook: s?.facebook || 'nicmiller.photography',
      copyright: s?.copyright || '© 2026 Nic Miller Photography. All rights reserved.',
    }
  } catch {
    return { email:'nmiller3300@gmail.com', instagram:'nicmiller.photography', facebook:'nicmiller.photography', copyright:'© 2026 Nic Miller Photography. All rights reserved.' }
  }
}

export default async function ContactPage() {
  const s = await getSettings()
  const iconStyle: React.CSSProperties = { width: '38px', height: '38px', flex: '0 0 38px', borderRadius: '11px', background: 'rgba(200,146,60,0.12)', border: '1px solid rgba(200,146,60,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }

  return (
    <div style={{ background: '#0b0a09', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(40px,8vh,90px) 32px 80px', animation: 'nmrise .6s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.34em', color: '#c8923c', marginBottom: '16px' }}>CONTACT</div>
          <h1 style={{ fontFamily: 'var(--font-jost)', fontWeight: 200, fontSize: 'clamp(32px,4.6vw,56px)', letterSpacing: '0.04em', margin: 0, color: '#f4f1ec' }}>Let&#39;s Talk Light</h1>
          <p style={{ fontSize: '15px', color: 'rgba(244,241,236,0.6)', margin: '18px auto 0', maxWidth: '480px', fontWeight: 300 }}>Print enquiries, licensing, or just to talk photography — send a note.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '30px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', gap: '13px', alignItems: 'center' }}>
              <span style={iconStyle}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e3b463" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="m4 7 8 6 8-6"/></svg></span>
              <div><div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(244,241,236,0.45)' }}>EMAIL</div><div style={{ fontSize: '14px', color: '#f4f1ec' }}>{s.email}</div></div>
            </div>
            <div style={{ display: 'flex', gap: '13px', alignItems: 'center' }}>
              <span style={iconStyle}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e3b463" strokeWidth="1.6"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
              <div><div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(244,241,236,0.45)' }}>BASED IN</div><div style={{ fontSize: '14px', color: '#f4f1ec' }}>Flowery Branch, Georgia</div></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram" style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none"/></svg>
              </a>
              {s.facebook && (
                <a href={`https://facebook.com/${s.facebook}`} target="_blank" rel="noreferrer" aria-label="Facebook" style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M14 9h2.6l.4-3H14V4.4c0-.9.25-1.5 1.5-1.5H17V.2C16.7.15 15.8.05 14.8.05 12.4.05 11 1.45 11 4.05V6H8.5v3H11v9h3V9z"/></svg>
                </a>
              )}
            </div>
          </div>
          <ContactClient />
        </div>
      </div>
      <Footer copyright={s.copyright} instagram={s.instagram} facebook={s.facebook} />
    </div>
  )
}
