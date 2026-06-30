'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export default function Nav() {
  const path = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const nc = (href: string) =>
    path === href ? '#e3b463' : 'rgba(244,241,236,0.82)'

  const mLink: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '13px 14px',
    borderRadius: '11px', background: 'none', border: 'none', color: '#f4f1ec',
    fontFamily: 'var(--font-manrope)', fontSize: '15px', cursor: 'pointer',
  }

  const navBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-manrope)', fontSize: '12px', letterSpacing: '0.2em',
  }

  return (
    <>
      <div style={{ position: 'sticky', top: 0, zIndex: 60, display: 'flex', justifyContent: 'center', padding: '18px 20px 0', pointerEvents: 'none' }}>
        <nav style={{ pointerEvents: 'auto', width: '100%', maxWidth: '1200px', display: 'flex', alignItems: 'center', gap: '22px', padding: '11px 22px', borderRadius: '18px', background: 'linear-gradient(180deg, rgba(20,18,16,0.8), rgba(13,11,10,0.72))', backdropFilter: 'blur(26px) saturate(150%)', WebkitBackdropFilter: 'blur(26px) saturate(150%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)' }}>

          {/* Desktop left links */}
          <div style={{ display: 'flex', gap: '28px', flex: 1, minWidth: 0 }} className="desknav">
            <Link href="/" style={{ ...navBtn, color: nc('/') }} className="nm-hl">HOME</Link>
            <Link href="/portfolio" style={{ ...navBtn, color: nc('/portfolio') }} className="nm-hl">PORTFOLIO</Link>
            <Link href="/prints" style={{ ...navBtn, color: nc('/prints') }} className="nm-hl">PRINTPRINT&nbsp;ROOMnbsp;SHOP</Link>
          </div>

          {/* Logo */}
          <Link href="/" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Image src="/nm-wordmark-white.png" alt="Nic Miller Photography" height={44} width={180} style={{ height: '44px', width: 'auto' }} />
          </Link>

          {/* Desktop right links */}
          <div style={{ display: 'flex', gap: '28px', flex: 1, minWidth: 0, justifyContent: 'flex-end', alignItems: 'center' }} className="desknav">
            <Link href="/about" style={{ ...navBtn, color: nc('/about') }} className="nm-hl">ABOUT</Link>
            <Link href="/contact" style={{ ...navBtn, color: nc('/contact') }} className="nm-hl">CONTACT</Link>
          </div>

          {/* Mobile hamburger */}
          <div style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', display: 'none' }} className="mobbar">
            <button onClick={() => setMenuOpen(o => !o)} className="nm-hl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', width: '40px', height: '40px', cursor: 'pointer', color: '#f4f1ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', zIndex: 80, top: '78px', left: '20px', right: '20px', borderRadius: '18px', padding: '14px', background: 'rgba(18,16,14,0.92)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', animation: 'nmover .3s ease both' }}>
          {[['/', 'Home'], ['/portfolio', 'Portfolio'], ['/prints', 'Print Shop'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => (
            <Link key={href} href={href} style={mLink} onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
        </div>
      )}
    </>
  )
}
