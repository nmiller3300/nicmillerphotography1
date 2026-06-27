export const dynamic = 'force-dynamic'

/**
 * app/admin/page.tsx
 *
 * Admin CMS page — server-renders the initial data then hands off to the
 * client component (AdminPanel) for interactive state management.
 *
 * PORT THIS FROM: "Admin Panel.dc.html"
 * The full JSX is in the script block (state, render, methods).
 * Every method that calls localStorage.* should be replaced with a fetch()
 * call to the corresponding /api/admin/* route.
 *
 * localStorage → API mapping:
 *   localStorage.getItem('nm_heroEyebrow')  →  GET /api/admin/content
 *   localStorage.setItem('nm_heroEyebrow')  →  PATCH /api/admin/content
 *   localStorage.getItem('nm_uploads')      →  GET /api/admin/media
 *   new FileReader / readAsDataURL          →  POST /api/admin/upload (FormData)
 *   localStorage.getItem('nm_msgs')         →  GET /api/admin/messages
 *   localStorage.getItem('nm_prints')       →  GET /api/admin/prints
 *   localStorage.getItem('nm_seo')          →  GET /api/admin/seo
 *   localStorage.getItem('nm_settings')     →  GET /api/admin/settings
 *   localStorage.getItem('nm_categories')   →  GET /api/admin/categories
 *   localStorage.getItem('nm_meta')         →  merged into GET /api/admin/media (status, flags)
 */

import { db } from '@/lib/db'

async function getAdminBootstrapData() {
  const [content, media, messages, prints, seo, settings, categories] = await Promise.all([
    db.siteContent.findMany(),
    db.media.findMany({
      where: { status: { not: 'archived' } },
      include: { derivatives: { where: { format: 'webp', width: 960 }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 48,
    }),
    db.message.findMany({ orderBy: { createdAt: 'desc' } }),
    db.print.findMany({ orderBy: { id: 'asc' } }),
    db.seoSettings.findFirst(),
    db.settings.findFirst(),
    db.category.findMany({ orderBy: { order: 'asc' } }),
  ])

  return {
    content: Object.fromEntries(content.map((r) => [r.key, r.value])),
    media: media.map((m) => ({
      id: m.id,
      title: m.title,
      location: m.location,
      status: m.status,
      orientation: m.orientation,
      featured: m.featured,
      printEnabled: m.printEnabled,
      homepage: m.homepage,
      thumbUrl: m.derivatives[0]?.url ?? null,
    })),
    messages,
    prints,
    seo,
    settings,
    categories: categories.map((c) => c.name),
  }
}

export default async function AdminPage() {
  const bootstrapData = await getAdminBootstrapData()

  return (
    // ──────────────────────────────────────────────────────────────────────
    // PORT THE FULL JSX FROM: "Admin Panel.dc.html"
    //
    // The admin panel is a single-page app with a sidebar nav and content area.
    // Convert it to a 'use client' component: AdminPanel.tsx
    //
    // Pass `bootstrapData` as props to hydrate initial state without
    // a loading flash. After that, state changes call the API routes.
    //
    // Key method replacements (all in Admin Panel.dc.html):
    //
    //   componentDidMount() {                      →  useEffect(() => { fetchAll() }, [])
    //     localStorage.getItem('nm_heroEyebrow')   →  fetch('/api/admin/content')
    //   }
    //
    //   triggerUpload() / onFiles(e) {
    //     new FileReader().readAsDataURL(file)      →  FormData + fetch('/api/admin/upload', { method:'POST', body:formData })
    //     localStorage.setItem('nm_uploads', ...)  →  handled by API
    //   }
    //
    //   saveHomepage() {
    //     localStorage.setItem('nm_heroEyebrow')   →  fetch('/api/admin/content', { method:'PATCH', body: JSON.stringify({heroEyebrow, heroTitle, heroSubtitle}) })
    //   }
    //
    //   saveEditor(status) {
    //     localStorage.setItem('nm_meta', ...)     →  fetch(`/api/admin/media/${id}`, { method:'PATCH', body: JSON.stringify({status, title, location}) })
    //   }
    //
    //   saveCats() {                               →  fetch('/api/admin/categories', { method:'PATCH' })
    //   saveSeo()  {                               →  fetch('/api/admin/seo', { method:'PATCH' })
    //   savePrints() {                             →  fetch('/api/admin/prints', { method:'PATCH', body: JSON.stringify([...prints]) })
    //   saveSettings() {                           →  fetch('/api/admin/settings', { method:'PATCH' })
    //   setMsgStatus(id, status) {                 →  fetch(`/api/admin/messages/${id}`, { method:'PATCH', body: JSON.stringify({status}) })
    //   openMsg(id) {                              →  fetch(`/api/admin/messages/${id}`) (auto-marks Read)
    //
    // The localStorage usage tracker (usedMB, storPct) can be removed entirely.
    // ──────────────────────────────────────────────────────────────────────

    <div style={{ background: '#0b0a09', minHeight: '100vh', color: '#f4f1ec', fontFamily: 'var(--font-manrope)' }}>
      {/* PORT: AdminPanel client component */}
      {/* Pass bootstrapData as serializable props */}
      <pre style={{ padding: 40, fontSize: 13, color: 'rgba(244,241,236,0.5)' }}>
        {JSON.stringify({ mediaCount: bootstrapData.media.length, messageCount: bootstrapData.messages.length }, null, 2)}
        {'\n\nPort Admin Panel.dc.html here as a "use client" component.\nSee comments above for the full localStorage → API mapping.'}
      </pre>
    </div>
  )
}
