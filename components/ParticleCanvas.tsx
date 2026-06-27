'use client'

import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(2, window.devicePixelRatio || 1)
    let W = 0, H = 0
    type Particle = { x: number; y: number; r: number; sp: number; sway: number; ph: number; a: number }
    let P: Particle[] = []

    const make = (init: boolean): Particle => ({
      x: Math.random() * W,
      y: init ? Math.random() * H : H + 8,
      r: Math.random() * 1.7 + 0.4,
      sp: Math.random() * 0.32 + 0.1,
      sway: Math.random() * 0.5 + 0.15,
      ph: Math.random() * Math.PI * 2,
      a: Math.random() * 0.45 + 0.15,
    })

    const resize = () => {
      W = c.clientWidth
      H = c.clientHeight
      c.width = W * DPR
      c.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      const N = Math.max(28, Math.min(64, Math.round((W * H) / 26000)))
      P = []
      for (let i = 0; i < N; i++) P.push(make(true))
    }

    resize()
    window.addEventListener('resize', resize)

    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let rafId = 0

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of P) {
        p.y -= p.sp
        p.ph += 0.012
        p.x += Math.sin(p.ph) * p.sway * 0.35
        if (p.y < -8) Object.assign(p, make(false))
        const tw = 0.55 + 0.45 * Math.sin(p.ph * 2)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, 6.283)
        ctx.fillStyle = `rgba(227,180,99,${p.a * tw * 0.55})`
        ctx.shadowBlur = 7
        ctx.shadowColor = 'rgba(200,146,60,0.55)'
        ctx.fill()
      }
      rafId = requestAnimationFrame(tick)
    }

    if (!reduce) rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  )
}
