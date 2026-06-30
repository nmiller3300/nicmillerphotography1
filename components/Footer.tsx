import Link from 'next/link'
import Image from 'next/image'
import AdminLoginButton from './AdminLoginButton'

export default function Footer({
  copyright = '© 2026 Nic Miller Photography. All rights reserved.',
  instagram = 'nicmiller.photography',
  facebook = 'nicmiller.photography',
}: { copyright?: string; instagram?: string; facebook?: string }) {
  const btnStyle: React.CSSProperties = { background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-manrope)', fontSize:'11px', letterSpacing:'0.16em', color:'rgba(244,241,236,0.55)' }

  return (
    <footer style={{ position:'relative', zIndex:6, background:'#080706', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'30px 0' }}>
      <div style={{ maxWidth:'1264px', margin:'0 auto', padding:'0 32px', display:'flex', alignItems:'center', gap:'28px', flexWrap:'wrap' }}>
        <Link href="/" style={{ flex:'0 0 auto' }}>
          <Image src="/nm-wordmark-white.png" alt="Nic Miller Photography" height={38} width={152} style={{ height:'38px', width:'auto', opacity:0.92 }} />
        </Link>
        <nav style={{ display:'flex', gap:'26px', flexWrap:'wrap', flex:1, justifyContent:'center', minWidth:'200px' }}>
          <Link href="/prints" style={btnStyle} className="nm-hl">PRINT&nbsp;SHOP</Link>
          <Link href="/contact" style={btnStyle} className="nm-hl">CONTACT</Link>
          <Link href="/about" style={btnStyle} className="nm-hl">ABOUT</Link>
          <Link href="/story" style={btnStyle} className="nm-hl">MY&nbsp;STORY</Link>
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:'0 0 auto' }}>
          {/* Instagram */}
          <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram" style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none"/></svg>
          </a>
          {/* Facebook */}
          {facebook && (
            <a href={`https://facebook.com/${facebook}`} target="_blank" rel="noreferrer" aria-label="Facebook" style={{ width:'32px', height:'32px', borderRadius:'9px', background:'#1877F2', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M14 9h2.6l.4-3H14V4.4c0-.9.25-1.5 1.5-1.5H17V.2C16.7.15 15.8.05 14.8.05 12.4.05 11 1.45 11 4.05V6H8.5v3H11v9h3V9z"/></svg>
            </a>
          )}
          <AdminLoginButton />
        </div>
      </div>
      <div style={{ maxWidth:'1264px', margin:'18px auto 0', padding:'0 32px', fontSize:'10.5px', letterSpacing:'0.06em', color:'rgba(244,241,236,0.3)' }}>{copyright}</div>
    </footer>
  )
}
