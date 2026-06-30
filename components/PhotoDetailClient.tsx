'use client'

import { useState } from 'react'

interface Props {
  thumbUrl: string|null
  displayUrl: string|null
  title: string
  orientation: string|null
}

export default function PhotoDetailClient({ thumbUrl, displayUrl, title, orientation }: Props) {
  const [zoomed, setZoomed] = useState(false)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const img = displayUrl || thumbUrl || ''

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPos({ x, y })
  }

  // Cap zoom to 1.6x — looks great, never reveals WebP artifacts
  const ZOOM = 1.6

  return (
    <div
      onClick={() => setZoomed(z => !z)}
      onMouseMove={onMove}
      onMouseLeave={() => setZoomed(false)}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0e0c0a',
        cursor: zoomed ? 'zoom-out' : 'zoom-in',
        userSelect: 'none',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}
    >
      <img
        src={img}
        alt={title}
        style={{
          display: 'block',
          width: '100%',
          maxHeight: '82vh',
          objectFit: 'contain',
          transform: zoomed ? `scale(${ZOOM})` : 'scale(1)',
          transformOrigin: zoomed ? `${pos.x}% ${pos.y}%` : 'center center',
          transition: zoomed ? 'transform .12s ease-out' : 'transform .35s ease',
          willChange: 'transform',
        }}
      />
      {!zoomed && (
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 9,
          background: 'rgba(11,10,9,0.72)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 11.5, color: 'rgba(244,241,236,0.6)',
          pointerEvents: 'none',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>
          </svg>
          Click to zoom
        </div>
      )}
      {zoomed && (
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          padding: '5px 11px', borderRadius: 8,
          background: 'rgba(200,146,60,0.2)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(200,146,60,0.3)',
          fontSize: 11, color: '#e3b463',
          pointerEvents: 'none',
        }}>
          Move mouse to pan · click to zoom out
        </div>
      )}
    </div>
  )
}
