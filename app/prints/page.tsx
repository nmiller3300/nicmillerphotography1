export const dynamic = 'force-dynamic'

import Footer from '@/components/Footer'
import PrintsClient from '@/components/PrintsClient'
import { db } from '@/lib/db'

const DEFAULT_PRINTS = [
  { t:'Echoes of Dawn', loc:'Lofoten, Norway', img:'/work1.jpg', from:295, ed:'Ed. 1/25', paper:'Hahnemühle Photo Rag®', sizes:['16×24"','24×36"','30×45"'], featured:true, externalUrl:null },
  { t:'Coastal Ember', loc:'Big Sur, USA', img:'/work2.jpg', from:265, ed:'Open Edition', paper:'Canson Platine', sizes:['12×18"','20×30"'], featured:false, externalUrl:null },
  { t:'Starfield Pass', loc:'Atacama, Chile', img:'/work4.jpg', from:285, ed:'Ed. 1/30', paper:'Hahnemühle Photo Rag®', sizes:['16×24"','24×36"'], featured:false, externalUrl:null },
]

async function getData() {
  try {
    const [prints, settings] = await Promise.all([
      db.print.findMany({
        where: { published: true },
        include: { media: { include: { derivatives: { where: { format: 'webp', width: 960 }, take: 1 } } } },
        orderBy: [{ featured: 'desc' }, { id: 'asc' }],
      }),
      db.settings.findFirst(),
    ])
    const p = prints.length > 0 ? prints.map(p => ({
      t: p.title, loc: p.location ?? '', img: p.media?.derivatives[0]?.url ?? '/work1.jpg',
      from: p.fromPrice ?? 0, ed: p.edition ?? '', paper: p.paper ?? '',
      sizes: (p.sizes as Array<{label:string}> | null)?.map(s => s.label) ?? [],
      featured: p.featured, externalUrl: p.externalUrl,
    })) : DEFAULT_PRINTS
    return { prints: p, storeUrl: settings?.storeUrl ?? '#' }
  } catch {
    return { prints: DEFAULT_PRINTS, storeUrl: '#' }
  }
}

export default async function PrintsPage() {
  const { prints, storeUrl } = await getData()
  return (
    <div style={{ background: '#0b0a09', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1264px', margin: '0 auto', padding: 'clamp(40px,8vh,90px) 32px 80px', animation: 'nmrise .6s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '0.34em', color: '#c8923c', marginBottom: '16px' }}>PRINT&nbsp;ROOM</div>
          <h1 style={{ fontFamily: 'var(--font-jost)', fontWeight: 200, fontSize: 'clamp(34px,5vw,58px)', letterSpacing: '0.04em', margin: 0, color: '#f4f1ec' }}>Fine Art Prints</h1>
          <p style={{ fontSize: '15px', color: 'rgba(244,241,236,0.6)', margin: '18px auto 0', maxWidth: '560px', fontWeight: 300 }}>Museum-grade archival prints, produced with a professional lab and shipped worldwide.</p>
        </div>
        <PrintsClient prints={prints} storeUrl={storeUrl} />
        <div style={{ marginTop: '40px', padding: '22px 26px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>
          <span style={{ fontSize: '13px', color: 'rgba(244,241,236,0.6)', flex: 1, minWidth: '240px' }}>Checkout & professional-lab fulfillment are handled securely through Pixieset. Your full-resolution files stay private.</span>
        </div>
      </div>
      <Footer />
    </div>
  )
}
