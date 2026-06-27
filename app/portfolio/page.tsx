export const dynamic = 'force-dynamic'

import Footer from '@/components/Footer'
import PortfolioClient from '@/components/PortfolioClient'
import { db } from '@/lib/db'

const DEFAULT_GALLERY = [
  { t:'Echoes of Dawn', loc:'Lofoten, Norway', cat:'Landscapes', img:'/work1.jpg' },
  { t:'The Watcher', loc:'Dolomites, Italy', cat:'Wildlife', img:'/work2.jpg' },
  { t:'Coastal Ember', loc:'Big Sur, USA', cat:'Landscapes', img:'/work3.jpg' },
  { t:'Silent Cathedral', loc:'Olympic NP, USA', cat:'Nature', img:'/work4.jpg' },
  { t:'Starfield Pass', loc:'Atacama, Chile', cat:'Landscapes', img:'/work5.jpg' },
  { t:'Dunes of Gold', loc:'Namib Desert', cat:'Nature', img:'/work1.jpg' },
  { t:'Heron at First Light', loc:'Camargue, France', cat:'Birds', img:'/portrait.jpg' },
]

const DEFAULT_CATS = ['Wildlife','Landscapes','Nature','Birds','Aquatic Life']

async function getData() {
  try {
    const [cats, media] = await Promise.all([
      db.category.findMany({ orderBy: { order: 'asc' } }),
      db.media.findMany({
        where: { status: 'published' },
        include: { derivatives: { where: { format: 'webp', width: 960 }, take: 1 }, category: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    const gallery = media.length > 0
      ? media.map(m => ({ t: m.title, loc: m.location ?? '', cat: m.category?.name ?? 'Uncategorized', img: m.derivatives[0]?.url ?? '/work1.jpg' }))
      : DEFAULT_GALLERY
    return { gallery, categories: cats.length > 0 ? cats.map(c => c.name) : DEFAULT_CATS }
  } catch {
    return { gallery: DEFAULT_GALLERY, categories: DEFAULT_CATS }
  }
}

export default async function PortfolioPage() {
  const { gallery, categories } = await getData()
  return (
    <div style={{ background: '#0b0a09', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1264px', margin: '0 auto', padding: 'clamp(40px,8vh,90px) 32px 80px', animation: 'nmrise .6s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '38px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.34em', color: '#c8923c', marginBottom: '16px' }}>PORTFOLIO</div>
          <h1 style={{ fontFamily: 'var(--font-jost)', fontWeight: 200, fontSize: 'clamp(34px,5vw,58px)', letterSpacing: '0.04em', margin: 0, color: '#f4f1ec' }}>Collected Works</h1>
          <p style={{ fontSize: '15px', color: 'rgba(244,241,236,0.6)', margin: '18px auto 0', maxWidth: '520px', fontWeight: 300 }}>Wildlife, landscapes, and quiet natural moments — gathered by series.</p>
        </div>
        <PortfolioClient gallery={gallery} categories={categories} />
      </div>
      <Footer />
    </div>
  )
}
