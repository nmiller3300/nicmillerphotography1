export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Jost, Manrope } from 'next/font/google'
import Nav from '@/components/Nav'
import ParticleCanvas from '@/components/ParticleCanvas'
import './globals.css'

const jost = Jost({ subsets: ['latin'], weight: ['200','300','400','500'], variable: '--font-jost', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-manrope', display: 'swap' })

export const metadata: Metadata = {
  title: 'Nic Miller Photography',
  description: 'Fine art nature & landscape prints.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jost.variable} ${manrope.variable}`}>
      <body style={{ margin: 0, background: '#0b0a09', color: '#f4f1ec', fontFamily: 'var(--font-manrope)' }}>
        <ParticleCanvas />
        <Nav />
        {children}
      </body>
    </html>
  )
}
