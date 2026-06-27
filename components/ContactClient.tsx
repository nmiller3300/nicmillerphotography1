'use client'

import { useState } from 'react'

export default function ContactClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 15px', borderRadius: '11px', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.14)', color: '#f4f1ec', fontFamily: 'var(--font-manrope)', fontSize: '14px', outline: 'none' }

  const send = async () => {
    if (!name || !email || !body) return
    setSending(true)
    try {
      await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, body }) })
      setSent(true)
    } catch {
      setSent(true)
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div style={{ borderRadius: '18px', padding: '40px 28px', textAlign: 'center', background: 'rgba(200,146,60,0.08)', border: '1px solid rgba(200,146,60,0.3)' }}>
        <div style={{ width: '52px', height: '52px', margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(200,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e3b463" strokeWidth="2"><path d="m5 12 5 5L20 6"/></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-jost)', fontSize: '21px', marginBottom: '8px', color: '#f4f1ec' }}>Message sent</div>
        <div style={{ fontSize: '14px', color: 'rgba(244,241,236,0.6)' }}>Thank you — I&#39;ll be in touch shortly.</div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: '18px', padding: '26px', background: 'rgba(20,18,16,0.6)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      <textarea placeholder="Tell me about your project…" rows={4} value={body} onChange={e => setBody(e.target.value)} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-manrope)' }} />
      <button onClick={send} disabled={sending} className="nm-gold" style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(180deg,#d49a40,#b07c2e)', color: '#1a130a', fontWeight: 600, fontSize: '12.5px', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)' }}>
        {sending ? 'SENDING…' : 'SEND\u00a0MESSAGE'}
      </button>
    </div>
  )
}
