'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginButton() {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (p: string) => {
    if (p.length !== 6) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p }),
      })
      if (res.ok) {
        router.push('/admin')
      } else {
        setError(true)
        setPin('')
      }
    } catch {
      setError(true)
      setPin('')
    }
    setLoading(false)
  }

  const onPin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(v)
    setError(false)
    if (v.length === 6) setTimeout(() => submit(v), 140)
  }

  const pinBoxes = Array.from({ length: 6 }).map((_, i) => ({
    char: pin[i] || '',
    active: i === pin.length,
  }))

  return (
    <>
      <button
        onClick={() => { setOpen(true); setPin(''); setError(false) }}
        className="nm-hl"
        style={{ marginLeft: '6px', padding: '8px 18px', borderRadius: '9px', border: '1px solid rgba(200,146,60,0.45)', background: 'rgba(200,146,60,0.06)', color: '#e3b463', fontFamily: 'var(--font-manrope)', fontSize: '10.5px', letterSpacing: '0.2em', cursor: 'pointer' }}
      >
        ADMIN
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(6,5,4,0.62)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'nmover .35s ease both' }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '380px', borderRadius: '22px', padding: '38px 34px 32px', background: 'linear-gradient(180deg, rgba(28,25,21,0.86), rgba(16,14,12,0.82))', backdropFilter: 'blur(40px) saturate(160%)', WebkitBackdropFilter: 'blur(40px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)', animation: 'nmover .4s cubic-bezier(.2,.7,.2,1) both' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
              <span style={{ width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 35%, rgba(200,146,60,0.32), rgba(200,146,60,0.08))', border: '1px solid rgba(200,146,60,0.35)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e3b463" strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4" fill="#e3b463" stroke="none"/></svg>
              </span>
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-jost)', fontWeight: 400, fontSize: '17px', letterSpacing: '0.16em', color: '#f4f1ec', marginBottom: '6px' }}>ADMIN&nbsp;ACCESS</div>
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(244,241,236,0.5)', marginBottom: '22px' }}>Enter your 6-digit PIN</div>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {pinBoxes.map((b, i) => (
                  <div key={i} style={{ width: '42px', height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-jost)', fontSize: '24px', color: '#f4f1ec', background: 'rgba(0,0,0,0.3)', border: `1px solid ${b.active ? 'rgba(200,146,60,0.7)' : error ? 'rgba(224,113,90,0.55)' : 'rgba(255,255,255,0.14)'}`, boxShadow: b.active ? '0 0 0 3px rgba(200,146,60,0.15)' : 'none' }}>
                    {b.char}
                  </div>
                ))}
              </div>
              <input
                value={pin}
                onChange={onPin}
                onKeyDown={e => { if (e.key === 'Enter') submit(pin) }}
                inputMode="numeric"
                type="tel"
                autoFocus
                maxLength={6}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none' }}
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '11px', fontSize: '12px', color: '#e0715a' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>
                Incorrect PIN. Please try again.
              </div>
            )}

            <button
              onClick={() => submit(pin)}
              disabled={loading}
              className="nm-gold"
              style={{ marginTop: '20px', width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(200,146,60,0.5)', background: 'linear-gradient(180deg,#d49a40,#b07c2e)', color: '#1a130a', fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: '13px', letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              {loading ? 'Checking…' : 'Enter Admin'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
