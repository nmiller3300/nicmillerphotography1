export const dynamic = 'force-dynamic'

/**
 * app/page.tsx
 *
 * Public home page — server-rendered from the DB for SEO.
 *
 * PORT THIS FROM: "Nic Miller Photography.dc.html"
 * The HTML sections to convert are marked below. Each {{ variable }} in the
 * original maps to a server prop. Each sc-if becomes a conditional. Each
 * sc-for becomes .map(). The gold-particle canvas is a client component.
 *
 * The prototype renders: Home | Portfolio | Print Room | About | Story | Contact
 * as tabs within a single page component. In Next.js these become separate
 * routes (pages/) but share the same Nav and layout. The home route only
 * renders the Home section.
 */

import { db } from '@/lib/db'
import { Metadata } from 'next'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Derivative {
  format: string
  width: number
  url: string
}

interface RecentPhoto {
  id: number
  title: string
  location: string | null
  derivatives: Derivative[]
}

interface PrintListing {
  id: number
  title: string
  location: string | null
  fromPrice: number | null
  edition: string | null
  paper: string | null
  featured: boolean
  externalUrl: string | null
  media: { derivatives: Derivative[] } | null
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getHomeData() {
  const [contentRows, recentWork, prints, settings] = await Promise.all([
    db.siteContent.findMany({
      where: { key: { in: ['heroEyebrow', 'heroTitle', 'heroSubtitle', 'aboutBio'] } },
    }),
    db.media.findMany({
      where: { status: 'published', homepage: true },
      include: { derivatives: { orderBy: { width: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.print.findMany({
      where: { published: true },
      include: {
        media: { include: { derivatives: { where: { format: 'webp' }, orderBy: { width: 'asc' } } } },
      },
      orderBy: [{ featured: 'desc' }, { id: 'asc' }],
    }),
    db.settings.findFirst(),
  ])

  const content = Object.fromEntries(contentRows.map((r) => [r.key, r.value as string]))

  return {
    heroEyebrow: content.heroEyebrow ?? 'BEYOND THE FRAME.',
    heroTitle: content.heroTitle ?? 'A Different Way of Seeing Beauty.',
    heroSubtitle:
      content.heroSubtitle ??
      'Wildlife, landscapes, and natural moments\nphotographed with atmosphere and intention.',
    aboutBio:
      content.aboutBio ??
      "I'm Nic — a nature, wildlife and landscape photographer.",
    recentWork: recentWork as RecentPhoto[],
    prints: prints as PrintListing[],
    storeUrl: settings?.storeUrl ?? '#',
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { heroEyebrow, heroTitle, heroSubtitle, aboutBio, recentWork, prints, storeUrl } =
    await getHomeData()

  // Best public derivative URL at a given width
  function thumbUrl(derivatives: Derivative[], preferWidth = 960): string {
    const webp = derivatives
      .filter((d) => d.format === 'webp')
      .sort((a, b) => Math.abs(a.width - preferWidth) - Math.abs(b.width - preferWidth))
    return webp[0]?.url ?? ''
  }

  // Generate a srcset from derivatives for responsive images
  function srcSet(derivatives: Derivative[], format = 'webp'): string {
    return derivatives
      .filter((d) => d.format === format)
      .map((d) => `${d.url} ${d.width}w`)
      .join(', ')
  }

  return (
    // ────────────────────────────────────────────────────────────────────────
    // PORT THE FULL JSX FROM:
    //   "Nic Miller Photography.dc.html" → <sc-if value="{{ isHome }}"> block
    //   Lines ~78–171 (the Home section: hero header + recent work slider)
    //
    // Key substitutions:
    //   {{ heroEyebrow }}    →  {heroEyebrow}
    //   {{ heroTitle }}      →  {heroTitle}
    //   {{ heroSubtitle }}   →  {heroSubtitle}  (use whitespace-pre-line for \n)
    //   {{ recentWork }}     →  {recentWork.map(p => ...)}
    //   <sc-for as="p">      →  .map((p, i) => <div key={i}>...</div>)
    //   <sc-if value="...">  →  {condition && <div>...</div>}
    //
    // The gold-particle canvas at id="nm-particles" must be a client component:
    //   import ParticleCanvas from '@/components/ParticleCanvas'
    //   Drop <ParticleCanvas /> above the nav.
    //
    // The nav links become <Link href="/portfolio">, <Link href="/prints">, etc.
    // ────────────────────────────────────────────────────────────────────────
    <main style={{ position: 'relative', width: '100%', overflowX: 'hidden', fontFamily: 'var(--font-manrope)', color: '#f4f1ec', background: '#0b0a09' }}>
      {/* PORT: <canvas id="nm-particles"> → <ParticleCanvas /> (client component) */}
      {/* PORT: Nav */}
      {/* PORT: Hero header — use heroEyebrow, heroTitle, heroSubtitle */}
      {/* PORT: Recent work slider — map over recentWork, use thumbUrl() + srcSet() */}
      {/* PORT: Footer */}

      {/* ── Temporary placeholder until JSX port is complete ── */}
      <div style={{ padding: '120px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, letterSpacing: '0.42em', color: '#c8923c', marginBottom: 22 }}>
          {heroEyebrow}
        </div>
        <h1 style={{ fontFamily: 'var(--font-jost)', fontWeight: 200, fontSize: 'clamp(38px, 5.6vw, 74px)', lineHeight: 1.08, margin: '0 0 26px' }}>
          {heroTitle}
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(244,241,236,0.8)', maxWidth: 440, margin: '0 auto', whiteSpace: 'pre-line' }}>
          {heroSubtitle}
        </p>
        <p style={{ marginTop: 48, color: 'rgba(244,241,236,0.4)', fontSize: 13 }}>
          ⬆ Port the full homepage JSX from the dc.html prototype
        </p>
      </div>
    </main>
  )
}
