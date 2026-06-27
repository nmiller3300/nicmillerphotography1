'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'dashboard'|'media'|'editor'|'messages'|'homepage'|'about'|'portfolio'|'print'|'seo'|'settings'

interface MediaItem {
  id: number; title: string; location?: string|null; status: string
  featured?: boolean; printEnabled?: boolean; homepage?: boolean; orientation?: string
  thumbUrl?: string|null
}

interface MsgItem {
  id: number; name: string; email: string; body: string
  status: string; createdAt: string
}

interface PrintItem {
  id: number; title: string; location?: string|null; fromPrice?: number|null
  edition?: string|null; paper?: string|null; featured: boolean; published: boolean
  thumbUrl?: string|null; externalUrl?: string|null
}

interface EditorFields {
  title: string; caption: string; description: string; alt: string
  captureDate: string; location: string; camera: string
  status: 'draft'|'published'; featured: boolean; printEnabled: boolean; homepage: boolean
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const C = {
  bg: '#0b0a09', gold: '#c8923c', goldL: '#e3b463',
  text: '#f4f1ec', muted: 'rgba(244,241,236,0.6)', dim: 'rgba(244,241,236,0.38)',
  border: 'rgba(255,255,255,0.08)', surface: 'rgba(20,18,16,0.6)',
}
const card: React.CSSProperties = { borderRadius:18, padding:22, background:C.surface, backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)', border:`1px solid ${C.border}`, boxShadow:'0 14px 40px rgba(0,0,0,0.35)' }
const h3s: React.CSSProperties = { fontFamily:'var(--font-jost)', fontWeight:400, fontSize:16, letterSpacing:'0.04em', margin:0, color:C.text }
const inp: React.CSSProperties = { width:'100%', padding:'11px 13px', borderRadius:10, background:'rgba(0,0,0,0.28)', border:'1px solid rgba(255,255,255,0.14)', color:C.text, fontFamily:'var(--font-manrope)', fontSize:13.5, outline:'none', boxSizing:'border-box' }
const saveBtn: React.CSSProperties = { padding:'11px 20px', borderRadius:11, border:'1px solid rgba(200,146,60,0.5)', background:'linear-gradient(180deg,#c8923c,#b07c2e)', color:'#1a130a', fontWeight:600, fontSize:12.5, cursor:'pointer', fontFamily:'var(--font-manrope)' }
const ghostBtn: React.CSSProperties = { padding:'10px 16px', borderRadius:11, border:'1px solid rgba(255,255,255,0.14)', background:'rgba(255,255,255,0.04)', color:C.text, fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-manrope)' }
const fLabel: React.CSSProperties = { display:'block', fontSize:11, letterSpacing:'0.04em', color:C.muted, marginBottom:6 }
const togOn: React.CSSProperties = { width:38, height:22, borderRadius:22, background:'linear-gradient(180deg,#c8923c,#a8772c)', position:'relative', display:'inline-block', border:'none', cursor:'pointer', flexShrink:0 }
const togOff: React.CSSProperties = { width:38, height:22, borderRadius:22, background:'rgba(255,255,255,0.12)', position:'relative', display:'inline-block', border:'none', cursor:'pointer', flexShrink:0 }
const knobOn: React.CSSProperties = { position:'absolute', top:2, right:2, width:18, height:18, borderRadius:'50%', background:'#fff', pointerEvents:'none' }
const knobOff: React.CSSProperties = { position:'absolute', top:2, left:2, width:18, height:18, borderRadius:'50%', background:'#e8e3da', pointerEvents:'none' }

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={on ? togOn : togOff}><span style={on ? knobOn : knobOff} /></button>
}

function Row({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', fontSize:13, color:'rgba(244,241,236,0.85)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span>{label}</span><Toggle on={on} onClick={onClick} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Data
  const [media, setMedia] = useState<MediaItem[]>([])
  const [messages, setMessages] = useState<MsgItem[]>([])
  const [categories, setCategories] = useState<string[]>(['Wildlife','Landscapes','Nature','Birds','Aquatic Life'])
  const [prints, setPrints] = useState<PrintItem[]>([])
  const [msgFolder, setMsgFolder] = useState('New')
  const [openMsg, setOpenMsg] = useState<MsgItem|null>(null)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<'newest'|'oldest'>('newest')
  const [selected, setSelected] = useState<Record<number,boolean>>({})

  // Editor
  const [editId, setEditId] = useState<number|null>(null)
  const [editItem, setEditItem] = useState<MediaItem|null>(null)
  const [edFields, setEdFields] = useState<EditorFields>({ title:'', caption:'', description:'', alt:'', captureDate:'', location:'', camera:'', status:'draft', featured:false, printEnabled:false, homepage:false })
  const [device, setDevice] = useState<'desktop'|'tablet'|'mobile'|'fullscreen'>('desktop')
  const [zoom, setZoom] = useState(118)
  const [posX, setPosX] = useState(50)
  const [posY, setPosY] = useState(42)

  // Content
  const [hpEyebrow, setHpEyebrow] = useState('BEYOND THE FRAME.')
  const [hpTitle, setHpTitle] = useState('A Different Way of Seeing Beauty.')
  const [hpSub, setHpSub] = useState('Wildlife, landscapes, and natural moments\nphotographed with atmosphere and intention.')
  const [abBio, setAbBio] = useState("I'm Nic — a nature, wildlife and landscape photographer.")
  const [abStoryTitle, setAbStoryTitle] = useState('Beyond the Frame')
  const [abStory, setAbStory] = useState("I didn't start with a camera so much as a restlessness.\n\nWildlife taught me patience; landscapes taught me humility.")
  const [catDraft, setCatDraft] = useState('')

  // SEO
  const [seoTitle, setSeoTitle] = useState('Nic Miller Photography — Fine Art Nature & Landscape Prints')
  const [seoDesc, setSeoDesc] = useState('Limited-edition nature, wildlife and landscape prints by Nic Miller.')
  const [seoSlug, setSeoSlug] = useState('/')
  const [seoCanonical, setSeoCanonical] = useState('https://nicmiller.photography')
  const [seoIndex, setSeoIndex] = useState(true)

  // Settings
  const [setEmail, setSetEmail] = useState('nmiller3300@gmail.com')
  const [setIg, setSetIg] = useState('nicmiller.photography')
  const [setFb, setSetFb] = useState('nicmiller.photography')
  const [setCopyright, setSetCopyright] = useState('© 2026 Nic Miller Photography. All rights reserved.')
  const [setStore, setSetStore] = useState('https://nicmillerphotography.pixieset.com')
  const [setQuality, setSetQuality] = useState(82)
  const [setSess, setSetSess] = useState(120)

  function showToast(m: string) {
    setToast(m); setTimeout(() => setToast(''), 2400)
  }

  async function api(method: string, path: string, body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  }

  // ── Load all data on mount ──
  useEffect(() => {
    async function load() {
      try {
        const [mediaRes, msgRes, catsRes, printsRes, contentRes, seoRes, settRes] = await Promise.all([
          api('GET', '/api/admin/media?sort=newest'),
          api('GET', '/api/admin/messages'),
          api('GET', '/api/admin/categories'),
          api('GET', '/api/admin/prints'),
          api('GET', '/api/admin/content'),
          api('GET', '/api/admin/seo'),
          api('GET', '/api/admin/settings'),
        ])
        if (mediaRes.items) setMedia(mediaRes.items)
        if (msgRes.items) setMessages(msgRes.items)
        if (Array.isArray(catsRes)) setCategories(catsRes.map((c: {name:string}) => c.name))
        if (Array.isArray(printsRes)) setPrints(printsRes)
        if (contentRes) {
          if (contentRes.heroEyebrow) setHpEyebrow(contentRes.heroEyebrow)
          if (contentRes.heroTitle) setHpTitle(contentRes.heroTitle)
          if (contentRes.heroSubtitle) setHpSub(contentRes.heroSubtitle)
          if (contentRes.aboutBio) setAbBio(contentRes.aboutBio)
          if (contentRes.storyTitle) setAbStoryTitle(contentRes.storyTitle)
          if (contentRes.story && Array.isArray(contentRes.story)) setAbStory(contentRes.story.join('\n\n'))
        }
        if (seoRes) {
          if (seoRes.title) setSeoTitle(seoRes.title)
          if (seoRes.description) setSeoDesc(seoRes.description)
          if (seoRes.slug) setSeoSlug(seoRes.slug)
          if (seoRes.canonical) setSeoCanonical(seoRes.canonical)
          setSeoIndex(seoRes.indexable !== false)
        }
        if (settRes) {
          if (settRes.email) setSetEmail(settRes.email)
          if (settRes.instagram) setSetIg(settRes.instagram)
          if (settRes.facebook) setSetFb(settRes.facebook)
          if (settRes.copyright) setSetCopyright(settRes.copyright)
          if (settRes.storeUrl) setSetStore(settRes.storeUrl)
          if (settRes.imageQuality) setSetQuality(settRes.imageQuality)
          if (settRes.sessionMinutes) setSetSess(settRes.sessionMinutes)
        }
      } catch (e) { console.error('Load error', e) }
    }
    load()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    setLoading(true)
    showToast('Uploading...')
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method:'POST', body:form })
        const data = await res.json()
        if (data.id) {
          const newItem: MediaItem = { id:data.id, title:data.title, status:data.status, orientation:data.orientation, thumbUrl: data.derivatives?.[0]?.url ?? null }
          setMedia(prev => [newItem, ...prev])
        }
      } catch (err) { console.error(err) }
    }
    setLoading(false)
    setScreen('media')
    setFilter('drafts')
    showToast(files.length + ' photo' + (files.length > 1 ? 's' : '') + ' uploaded')
    e.target.value = ''
  }

  function openEditor(item: MediaItem) {
    setEditId(item.id)
    setEditItem(item)
    setEdFields({ title:item.title, caption:'', description:'', alt:'', captureDate:'', location:item.location||'', camera:'', status:item.status as 'draft'|'published', featured:item.featured||false, printEnabled:item.printEnabled||false, homepage:item.homepage||false })
    setScreen('editor')
  }

  async function saveEditor(status: 'draft'|'published') {
    if (!editId) return
    setLoading(true)
    try {
      await api('PATCH', `/api/admin/media/${editId}`, { ...edFields, status })
      setMedia(prev => prev.map(m => m.id === editId ? { ...m, ...edFields, status } : m))
      showToast(status === 'published' ? 'Published — live on the site' : 'Saved as draft')
      setScreen('media')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function saveHomepage() {
    setLoading(true)
    await api('PATCH', '/api/admin/content', { heroEyebrow:hpEyebrow, heroTitle:hpTitle, heroSubtitle:hpSub })
    showToast('Homepage saved — live on the site')
    setLoading(false)
  }

  async function saveAbout() {
    setLoading(true)
    const story = abStory.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
    await api('PATCH', '/api/admin/content', { aboutBio:abBio, storyTitle:abStoryTitle, story })
    showToast('About & story saved')
    setLoading(false)
  }

  async function saveCats() {
    setLoading(true)
    for (const name of categories) {
      await api('POST', '/api/admin/categories', { name }).catch(() => {})
    }
    showToast('Categories saved')
    setLoading(false)
  }

  async function saveSeo() {
    setLoading(true)
    await api('PATCH', '/api/admin/seo', { title:seoTitle, description:seoDesc, slug:seoSlug, canonical:seoCanonical, indexable:seoIndex })
    showToast('SEO saved')
    setLoading(false)
  }

  async function savePrints() {
    setLoading(true)
    await api('PATCH', '/api/admin/prints', prints.map(p => ({ id:p.id, title:p.title, location:p.location, fromPrice:p.fromPrice, featured:p.featured, published:p.published })))
    showToast('Print Room saved — live on the site')
    setLoading(false)
  }

  async function saveSettings() {
    setLoading(true)
    await api('PATCH', '/api/admin/settings', { email:setEmail, instagram:setIg, facebook:setFb, copyright:setCopyright, storeUrl:setStore, imageQuality:setQuality, sessionMinutes:setSess })
    showToast('Settings saved')
    setLoading(false)
  }

  async function openMsgItem(m: MsgItem) {
    setOpenMsg(m)
    if (m.status === 'New') {
      await api('PATCH', `/api/admin/messages/${m.id}`, { status:'Read' })
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, status:'Read' } : x))
    }
  }

  async function setMsgStatus(id: number, status: string) {
    await api('PATCH', `/api/admin/messages/${id}`, { status })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    if (status === 'Archived') setOpenMsg(null)
    showToast('Message ' + status.toLowerCase())
  }

  const folderMsgs = messages.filter(m => m.status === msgFolder)
  const publishedCount = media.filter(m => m.status === 'published').length
  const draftCount = media.filter(m => m.status === 'draft').length
  const printEnabledCount = media.filter(m => m.printEnabled).length
  const newMsgCount = messages.filter(m => m.status === 'New').length

  function filteredMedia() {
    let list = [...media]
    if (filter === 'published') list = list.filter(m => m.status === 'published')
    else if (filter === 'drafts') list = list.filter(m => m.status === 'draft')
    else if (filter === 'featured') list = list.filter(m => m.featured)
    else if (filter === 'print') list = list.filter(m => m.printEnabled)
    else if (filter === 'homepage') list = list.filter(m => m.homepage)
    else if (filter === 'archived') list = list.filter(m => m.status === 'archived')
    else list = list.filter(m => m.status !== 'archived')
    if (sort === 'oldest') list = list.reverse()
    return list
  }

  const navStyle = (active: boolean): React.CSSProperties => ({
    display:'flex', alignItems:'center', gap:12, width:'100%', padding:'11px 12px', borderRadius:11,
    border:`1px solid ${active ? 'rgba(200,146,60,0.4)' : 'transparent'}`,
    background: active ? 'linear-gradient(180deg,rgba(200,146,60,0.22),rgba(200,146,60,0.1))' : 'transparent',
    color: active ? C.goldL : 'rgba(244,241,236,0.7)', cursor:'pointer',
    fontFamily:'var(--font-manrope)', fontSize:13.5, textAlign:'left',
  })

  const railBtn = (active: boolean): React.CSSProperties => ({
    display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
    padding:'9px 11px', borderRadius:9, border:`1px solid ${active?'rgba(200,146,60,0.35)':'transparent'}`,
    background: active ? 'rgba(200,146,60,0.16)' : 'transparent',
    color: active ? C.goldL : 'rgba(244,241,236,0.62)', cursor:'pointer',
    fontFamily:'var(--font-manrope)', fontSize:12.5, marginBottom:2,
  })

  const devBtn = (active: boolean): React.CSSProperties => ({
    padding:'8px 13px', borderRadius:9, cursor:'pointer', fontFamily:'var(--font-manrope)', fontSize:12,
    border:`1px solid ${active?'rgba(200,146,60,0.45)':'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,146,60,0.16)' : 'rgba(255,255,255,0.04)',
    color: active ? C.goldL : 'rgba(244,241,236,0.7)',
  })

  const devAspect = { desktop:'16/9', tablet:'4/3', mobile:'9/16', fullscreen:'21/9' }
  const devLabel = { desktop:'Desktop hero', tablet:'Tablet', mobile:'Mobile hero', fullscreen:'Fullscreen' }

  const titles: Record<Screen,string> = { dashboard:'Dashboard', media:'Media Library', editor:'Image Editor', messages:'Messages', homepage:'Homepage Manager', about:'About', portfolio:'Portfolio Manager', print:'Print Room Manager', seo:'SEO', settings:'Settings' }
  const crumbs: Record<Screen,string> = { dashboard:'Overview', media:'Photography', editor:'Media Library', messages:'Inbox', homepage:'Public Site', about:'Public Site', portfolio:'Collections', print:'Commerce', seo:'Discovery', settings:'Configuration' }

  return (
    <div style={{ position:'relative', minHeight:'100vh', width:'100%', fontFamily:'var(--font-manrope)', color:C.text, background:C.bg, backgroundImage:'radial-gradient(120% 80% at 80% -10%, rgba(200,146,60,0.15), transparent 55%), radial-gradient(90% 70% at 0% 110%, rgba(120,150,200,0.05), transparent 60%)' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(140% 120% at 50% 0%, transparent 60%, rgba(0,0,0,0.5))' }} />
      <div style={{ position:'relative', display:'flex', gap:22, padding:22, minHeight:'100vh', alignItems:'flex-start' }}>

        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside style={{ position:'sticky', top:22, width:248, flexShrink:0, borderRadius:22, padding:'20px 16px', background:'linear-gradient(180deg,rgba(26,23,20,0.78),rgba(16,14,12,0.72))', backdropFilter:'blur(28px) saturate(140%)', WebkitBackdropFilter:'blur(28px) saturate(140%)', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px 18px' }}>
            <Image src="/nm-wordmark-white.png" alt="Nic Miller Photography" width={140} height={34} style={{ height:34, width:'auto' }} />
          </Link>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', margin:'0 4px 16px' }} />
          <nav style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {([
              ['dashboard','Dashboard', <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>],
              ['media','Media Library', <><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></>],
              ['portfolio','Portfolio', <><rect x="3" y="3.5" width="18" height="17" rx="2.4" opacity=".4"/><path d="M5 7h14M4 12h16M6 17h12"/></>],
              ['homepage','Homepage', <><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></>],
              ['print','Print Room', <><rect x="4" y="4" width="16" height="16" rx="1.6"/><rect x="8" y="8" width="8" height="8" rx="1"/></>],
              ['about','About', <><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></>],
              ['seo','SEO', <><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></>],
              ['settings','Settings', <><circle cx="16" cy="7" r="2.1"/><circle cx="8" cy="12" r="2.1"/><circle cx="13" cy="17" r="2.1"/><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h7M15 17h5"/></>],
            ] as [Screen, string, React.ReactNode][]).map(([key, label, icon]) => (
              <button key={key} onClick={() => setScreen(key)} style={navStyle(screen === key || (key === 'media' && screen === 'editor'))}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">{icon}</svg>
                <span style={{ flex:1, textAlign:'left' }}>{label}</span>
                {key === 'messages' && newMsgCount > 0 && <span style={{ fontSize:10, fontWeight:700, color:'#1a130a', background:C.gold, borderRadius:10, padding:'1px 7px' }}>{newMsgCount}</span>}
              </button>
            ))}
            <button onClick={() => setScreen('messages')} style={navStyle(screen === 'messages')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="m4 7 8 6 8-6"/></svg>
              <span style={{ flex:1, textAlign:'left' }}>Messages</span>
              {newMsgCount > 0 && <span style={{ fontSize:10, fontWeight:700, color:'#1a130a', background:C.gold, borderRadius:10, padding:'1px 7px' }}>{newMsgCount}</span>}
            </button>
          </nav>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)', margin:'16px 4px' }} />
          <Link href="/" className="nm-h" style={{ display:'flex', alignItems:'center', gap:9, marginTop:4, padding:'10px 12px', borderRadius:11, color:'rgba(244,241,236,0.55)', fontSize:12.5, border:'1px solid rgba(255,255,255,0.07)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 5 16 12l-7 7"/></svg>
            View public site
          </Link>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────── */}
        <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:22, paddingBottom:30 }}>
          {/* Header */}
          <header style={{ display:'flex', alignItems:'center', gap:18, padding:'14px 22px', borderRadius:18, background:'rgba(20,18,16,0.6)', backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 14px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', color:C.gold }}>{crumbs[screen]}</div>
              <div style={{ fontFamily:'var(--font-jost)', fontWeight:400, fontSize:21, letterSpacing:'0.02em', marginTop:3 }}>{titles[screen]}</div>
            </div>
            <div style={{ flex:1 }} />
            <button onClick={() => fileRef.current?.click()} className="nm-h" style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 16px', borderRadius:12, border:'1px solid rgba(200,146,60,0.45)', background:'linear-gradient(180deg,rgba(200,146,60,0.92),rgba(176,124,46,0.92))', color:'#1a130a', fontWeight:600, fontSize:13, cursor:'pointer', boxShadow:'0 6px 18px rgba(200,146,60,0.3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Upload Photograph
            </button>
            <div style={{ width:1, height:26, background:'rgba(255,255,255,0.1)' }} />
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#2a2620,#15120e)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:C.gold }}>NM</div>
          </header>

          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display:'none' }} />

          {/* Toast */}
          {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:120, padding:'12px 22px', borderRadius:12, background:'rgba(20,18,16,0.94)', backdropFilter:'blur(20px)', border:'1px solid rgba(200,146,60,0.4)', color:C.goldL, fontSize:13, boxShadow:'0 14px 40px rgba(0,0,0,0.5)', animation:'nmfade .3s ease both', whiteSpace:'nowrap' }}>{toast}</div>}

          {/* ── DASHBOARD ── */}
          {screen === 'dashboard' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20, animation:'nmfade .5s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
                {[
                  { label:'Upload Photograph', sub:'Add to Media Library', icon:<><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></>, action:() => fileRef.current?.click() },
                  { label:'Edit Homepage', sub:'Hero, sections, footer', icon:<><path d="M4 11 12 4l8 7M6 10v9h12v-9"/></>, action:() => setScreen('homepage') },
                  { label:'Create Collection', sub:'Group & order images', icon:<><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18"/></>, action:() => setScreen('portfolio') },
                  { label:'Add Print', sub:'New Print Room listing', icon:<><rect x="4" y="4" width="16" height="16" rx="1.6"/><rect x="8" y="8" width="8" height="8" rx="1"/></>, action:() => setScreen('print') },
                ].map(({ label, sub, icon, action }) => (
                  <button key={label} onClick={action} className="nm-h" style={{ display:'flex', alignItems:'center', gap:14, padding:18, borderRadius:16, background:'rgba(20,18,16,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer', fontFamily:'var(--font-manrope)', color:C.text, textAlign:'left' }}>
                    <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, flexShrink:0, borderRadius:12, background:'rgba(200,146,60,0.14)', color:C.goldL }}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">{icon}</svg>
                    </span>
                    <span>
                      <span style={{ display:'block', fontSize:14, fontWeight:600 }}>{label}</span>
                      <span style={{ display:'block', fontSize:11.5, color:'rgba(244,241,236,0.45)' }}>{sub}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,2fr)) minmax(240px,1fr)', gap:18 }}>
                <section style={card}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <h3 style={h3s}>Recent Uploads</h3>
                    <button onClick={() => setScreen('media')} style={{ background:'none', border:'none', color:C.gold, fontSize:12, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>View all →</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:12 }}>
                    {media.slice(0,4).map(p => (
                      <button key={p.id} onClick={() => openEditor(p)} className="nm-card" style={{ position:'relative', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, overflow:'hidden', cursor:'pointer', aspectRatio:'1', padding:0, color:C.text, background:'#15120e' }}>
                        {p.thumbUrl ? <img src={p.thumbUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.04)' }} />}
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 45%,rgba(0,0,0,0.78))' }} />
                        <div style={{ position:'absolute', left:8, right:8, bottom:7, textAlign:'left' }}>
                          <div style={{ fontSize:11, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                          <div style={{ fontSize:9.5, color:'rgba(244,241,236,0.55)' }}>{p.location || p.status}</div>
                        </div>
                        <span style={{ position:'absolute', top:8, left:8, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', padding:'3px 7px', borderRadius:6, background:'rgba(11,10,9,0.7)', backdropFilter:'blur(6px)', color:p.status==='published'?'#5fb87a':'#c8923c', border:`1px solid ${p.status==='published'?'#5fb87a44':'#c8923c44'}` }}>{p.status}</span>
                      </button>
                    ))}
                    {media.length === 0 && <div style={{ gridColumn:'1/-1', padding:'24px', textAlign:'center', fontSize:13, color:C.muted }}>No photos yet — upload to get started</div>}
                  </div>
                </section>
                <section style={card}>
                  <h3 style={{ ...h3s, marginBottom:14 }}>Library</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                    {[['#5fb87a','Published',publishedCount],['#c8923c','Drafts',draftCount],['#8aa0c8','Print Enabled',printEnabledCount]].map(([dot,label,count]) => (
                      <div key={label as string} style={{ display:'flex', alignItems:'center', gap:13, padding:13, borderRadius:13, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ width:9, height:9, borderRadius:'50%', background:dot as string, flexShrink:0 }} />
                        <span style={{ flex:1, fontSize:13 }}>{label}</span>
                        <span style={{ fontFamily:'var(--font-jost)', fontSize:23 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18 }}>
                <section style={card}>
                  <h3 style={{ ...h3s, marginBottom:14 }}>Current Homepage Hero</h3>
                  <div style={{ position:'relative', borderRadius:13, overflow:'hidden', aspectRatio:'16/10', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ position:'absolute', inset:0, background:"url('/hero-clean.jpg') center 30%/cover" }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.72))' }} />
                    <div style={{ position:'absolute', left:13, bottom:11 }}>
                      <div style={{ fontFamily:'var(--font-jost)', fontSize:15 }}>{hpTitle.slice(0,30)}</div>
                      <div style={{ fontSize:11, color:'rgba(244,241,236,0.6)' }}>{hpEyebrow}</div>
                    </div>
                  </div>
                  <button onClick={() => setScreen('homepage')} className="nm-h" style={{ ...ghostBtn, marginTop:13, width:'100%' }}>Edit Hero</button>
                </section>
                <section style={card}>
                  <h3 style={{ ...h3s, marginBottom:14 }}>Featured Print</h3>
                  <div style={{ position:'relative', borderRadius:13, overflow:'hidden', aspectRatio:'16/10', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ position:'absolute', inset:0, background:"url('/featured.jpg') center/cover" }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.72))' }} />
                    <div style={{ position:'absolute', left:13, bottom:11 }}>
                      <div style={{ fontFamily:'var(--font-jost)', fontSize:15 }}>{prints.find(p=>p.featured)?.title || 'No featured print'}</div>
                      <div style={{ fontSize:11, color:C.gold }}>From ${prints.find(p=>p.featured)?.fromPrice || '--'}</div>
                    </div>
                  </div>
                  <button onClick={() => setScreen('print')} className="nm-h" style={{ ...ghostBtn, marginTop:13, width:'100%' }}>Edit Print Room</button>
                </section>
                <section style={card}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <h3 style={h3s}>Recent Messages</h3>
                    <button onClick={() => setScreen('messages')} style={{ background:'none', border:'none', color:C.gold, fontSize:12, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>Inbox →</button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                    {messages.slice(0,3).map(m => (
                      <button key={m.id} onClick={() => { setScreen('messages'); openMsgItem(m) }} className="nm-h" style={{ display:'flex', gap:11, alignItems:'center', padding:10, borderRadius:12, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', textAlign:'left', width:'100%', color:C.text }}>
                        <span style={{ width:30, height:30, flexShrink:0, borderRadius:'50%', background:'linear-gradient(135deg,#2a2620,#15120e)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:C.gold }}>{m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                        <span style={{ minWidth:0, flex:1 }}>
                          <span style={{ display:'block', fontSize:12.5, fontWeight:600 }}>{m.name}</span>
                          <span style={{ display:'block', fontSize:11, color:C.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.body.slice(0,50)}</span>
                        </span>
                        {m.status === 'New' && <span style={{ width:7, height:7, borderRadius:'50%', background:C.gold, flexShrink:0 }} />}
                      </button>
                    ))}
                    {messages.length === 0 && <div style={{ padding:'20px', textAlign:'center', fontSize:13, color:C.muted }}>No messages yet</div>}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ── MEDIA LIBRARY ── */}
          {screen === 'media' && (
            <div style={{ display:'flex', gap:18, alignItems:'flex-start', animation:'nmfade .5s ease both' }}>
              <aside style={{ flexShrink:0, width:196, borderRadius:18, padding:'16px 12px', background:'rgba(20,18,16,0.6)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', position:'sticky', top:22 }}>
                {[['Status',''],['all','All'],['drafts','Drafts'],['published','Published'],['featured','Featured'],['print','Print Enabled'],['homepage','Homepage'],['archived','Archived'],['Orientation',''],['landscape','Landscape'],['portrait','Portrait'],['pano','Panoramic']].map(([key, label]) => {
                  if (!label) return <div key={key} style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.dim, padding:'12px 8px 6px' }}>{key}</div>
                  return <button key={key} onClick={() => setFilter(key)} style={railBtn(filter === key)}><span>{label}</span></button>
                })}
              </aside>
              <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:16, background:'rgba(20,18,16,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:13, color:C.muted }}>{filteredMedia().length} photographs</div>
                  <div style={{ flex:1 }} />
                  <div style={{ display:'flex', gap:2, padding:3, borderRadius:11, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)' }}>
                    {(['newest','oldest'] as const).map(s => (
                      <button key={s} onClick={() => setSort(s)} style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'var(--font-manrope)', fontSize:12, background:sort===s?'rgba(200,146,60,0.9)':'transparent', color:sort===s?'#1a130a':'rgba(244,241,236,0.65)', fontWeight:sort===s?600:400 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14 }}>
                  {filteredMedia().map(p => {
                    const sel = !!selected[p.id]
                    return (
                      <div key={p.id} className="nm-card" style={{ borderRadius:15, overflow:'hidden', background:'rgba(20,18,16,0.6)', backdropFilter:'blur(18px)', border:`1px solid ${sel?'rgba(200,146,60,0.55)':'rgba(255,255,255,0.08)'}`, boxShadow:sel?'0 0 0 1px rgba(200,146,60,0.4),0 14px 34px rgba(0,0,0,0.4)':'0 8px 24px rgba(0,0,0,0.3)' }}>
                        <div style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden' }}>
                          {p.thumbUrl ? <img src={p.thumbUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.04)' }} />}
                          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.12) 0%,transparent 30%,transparent 60%,rgba(0,0,0,0.5))' }} />
                          <button onClick={() => setSelected(prev => { const n={...prev}; if(n[p.id]) delete n[p.id]; else n[p.id]=true; return n })} style={{ position:'absolute', top:9, left:9, width:23, height:23, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:sel?'#e3b463':'rgba(11,10,9,0.55)', border:`1px solid ${sel?'#e3b463':'rgba(255,255,255,0.35)'}`, backdropFilter:'blur(6px)' }}>
                            {sel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a130a" strokeWidth="3.2"><path d="m5 12 5 5L20 6"/></svg>}
                          </button>
                          {p.featured && <span style={{ position:'absolute', top:9, right:9, width:23, height:23, borderRadius:7, background:'rgba(11,10,9,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', color:C.goldL, border:'1px solid rgba(200,146,60,0.4)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg></span>}
                          <span style={{ position:'absolute', bottom:9, left:9, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', padding:'3px 7px', borderRadius:6, background:'rgba(11,10,9,0.6)', backdropFilter:'blur(6px)', color:'rgba(244,241,236,0.85)', border:'1px solid rgba(255,255,255,0.14)' }}>{p.orientation || 'Landscape'}</span>
                        </div>
                        <div style={{ padding:'11px 12px', display:'flex', alignItems:'center', gap:9 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:p.status==='published'?'#5fb87a':p.status==='draft'?'#c8923c':'#8aa0c8' }} />
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ fontSize:12.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                            <div style={{ fontSize:10.5, color:'rgba(244,241,236,0.45)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.location || p.status}</div>
                          </div>
                          <button onClick={() => openEditor(p)} className="nm-h" style={{ flexShrink:0, width:28, height:28, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:C.gold, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {filteredMedia().length === 0 && <div style={{ gridColumn:'1/-1', padding:'48px', textAlign:'center', fontSize:13, color:C.muted }}>No photos in this filter.</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── IMAGE EDITOR ── */}
          {screen === 'editor' && editItem && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'nmfade .5s ease both' }}>
              <button onClick={() => setScreen('media')} className="nm-h" style={{ display:'flex', alignItems:'center', gap:7, alignSelf:'flex-start', background:'none', border:'none', color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'var(--font-manrope)', padding:'6px 10px', borderRadius:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
                Back to Media Library
              </button>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:18, alignItems:'start' }}>
                <section style={card}>
                  <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
                    {(['desktop','tablet','mobile','fullscreen'] as const).map(d => (
                      <button key={d} onClick={() => setDevice(d)} style={devBtn(device === d)}>{devLabel[d]}</button>
                    ))}
                  </div>
                  <div style={{ fontSize:11.5, color:'rgba(244,241,236,0.5)', marginBottom:14, lineHeight:1.55 }}>Each tab is a place this photo can appear. Pick one, then frame the photo just for that spot. Your original file is never changed.</div>
                  <div style={{ position:'relative', background:'repeating-conic-gradient(#141210 0% 25%, #100e0c 0% 50%) 0/22px 22px', borderRadius:14, padding:26, display:'flex', alignItems:'center', justifyContent:'center', minHeight:340 }}>
                    <div style={{ position:'relative', borderRadius:6, overflow:'hidden', boxShadow:'0 18px 50px rgba(0,0,0,0.55)', aspectRatio:devAspect[device], width: device === 'mobile' ? 'auto' : 'min(100%,520px)', height: device === 'mobile' ? 300 : 'auto' }}>
                      {editItem.thumbUrl ? (
                        <img src={editItem.thumbUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:`${posX}% ${posY}%`, transform:`scale(${zoom/100})` }} />
                      ) : (
                        <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.06)' }} />
                      )}
                      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.22) 1px,transparent 1px)', backgroundSize:'33.33% 33.33%' }} />
                      <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.5)', pointerEvents:'none' }} />
                      <div style={{ position:'absolute', left:`${posX}%`, top:`${posY}%`, transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', border:'2px solid #e3b463', boxShadow:'0 0 0 4px rgba(200,146,60,0.25), 0 0 12px rgba(0,0,0,0.6)', pointerEvents:'none' }} />
                    </div>
                    <span style={{ position:'absolute', left:14, top:12, fontSize:10.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(244,241,236,0.5)' }}>{devLabel[device]} framing</span>
                  </div>
                  <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:15 }}>
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8 }}><span style={{ color:C.muted }}>Zoom</span><span style={{ color:C.gold }}>{zoom}%</span></div>
                      <input type="range" min={100} max={240} value={zoom} onChange={e => setZoom(+e.target.value)} style={{ width:'100%' }} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      <div><div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Horizontal</div><input type="range" min={0} max={100} value={posX} onChange={e => setPosX(+e.target.value)} style={{ width:'100%' }} /></div>
                      <div><div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Vertical</div><input type="range" min={0} max={100} value={posY} onChange={e => setPosY(+e.target.value)} style={{ width:'100%' }} /></div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, color:'rgba(244,241,236,0.55)', marginRight:2 }}>Aspect</span>
                      {['Free','16:9','3:2','4:5','1:1'].map(a => <span key={a} style={{ padding:'6px 11px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontSize:11.5, color:'rgba(244,241,236,0.8)', cursor:'pointer' }}>{a}</span>)}
                      <div style={{ flex:1 }} />
                      <button onClick={() => { setZoom(118); setPosX(50); setPosY(42) }} className="nm-h" style={ghostBtn}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ marginRight:5, verticalAlign:-2 }}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/></svg>Reset
                      </button>
                    </div>
                    <div style={{ fontSize:11, color:'rgba(244,241,236,0.42)', display:'flex', alignItems:'center', gap:7, paddingTop:11, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.6"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3.5"/></svg>
                      Master stays untouched · this crop is saved as coordinates for {devLabel[device]} only
                    </div>
                  </div>
                </section>

                <section style={card}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
                    {editItem.thumbUrl && <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', flexShrink:0, border:'1px solid rgba(255,255,255,0.1)', background:`url('${editItem.thumbUrl}') center/cover` }} />}
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-jost)', fontSize:17 }}>{edFields.title}</div>
                      <div style={{ fontSize:11, color:'rgba(244,241,236,0.45)' }}>sRGB · master preserved</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:13, maxHeight:460, overflowY:'auto', paddingRight:4 }}>
                    {[['Public title','title'],['Caption','caption'],['Alt text','alt']].map(([label, key]) => (
                      <div key={key}>
                        <label style={fLabel}>{label}</label>
                        <input value={edFields[key as keyof EditorFields] as string} onChange={e => setEdFields(p=>({...p,[key]:e.target.value}))} style={inp} />
                      </div>
                    ))}
                    <div>
                      <label style={fLabel}>Description / story</label>
                      <textarea value={edFields.description} onChange={e => setEdFields(p=>({...p,description:e.target.value}))} rows={3} style={{ ...inp, minHeight:62, resize:'vertical' }} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
                      <div><label style={fLabel}>Capture date</label><input value={edFields.captureDate} onChange={e => setEdFields(p=>({...p,captureDate:e.target.value}))} style={inp} /></div>
                      <div><label style={fLabel}>Location</label><input value={edFields.location} onChange={e => setEdFields(p=>({...p,location:e.target.value}))} style={inp} /></div>
                    </div>
                    <div><label style={fLabel}>Camera & lens</label><input value={edFields.camera} onChange={e => setEdFields(p=>({...p,camera:e.target.value}))} style={inp} /></div>
                    <div style={{ display:'flex', flexDirection:'column', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:13 }}>
                      <Row label="Published" on={edFields.status==='published'} onClick={() => setEdFields(p=>({...p,status:p.status==='published'?'draft':'published'}))} />
                      <Row label="Featured" on={edFields.featured} onClick={() => setEdFields(p=>({...p,featured:!p.featured}))} />
                      <Row label="Homepage hero" on={edFields.homepage} onClick={() => setEdFields(p=>({...p,homepage:!p.homepage}))} />
                      <Row label="Available as print" on={edFields.printEnabled} onClick={() => setEdFields(p=>({...p,printEnabled:!p.printEnabled}))} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10, paddingTop:16, marginTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                    <button onClick={() => saveEditor('draft')} className="nm-h" style={{ ...ghostBtn, flex:1 }}>Save Draft</button>
                    <button onClick={() => { const url = editItem.thumbUrl || ''; if(url) window.open(url,'_blank') }} className="nm-h" style={{ ...ghostBtn, flex:1 }}>Preview</button>
                    <button onClick={() => saveEditor('published')} className="nm-h" style={{ flex:1.2, padding:11, borderRadius:11, border:'1px solid rgba(200,146,60,0.5)', background:'linear-gradient(180deg,#c8923c,#b07c2e)', color:'#1a130a', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>Publish</button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {screen === 'messages' && (
            <div style={{ display:'flex', gap:18, alignItems:'flex-start', animation:'nmfade .5s ease both', flexWrap:'wrap' }}>
              <aside style={{ flexShrink:0, width:180, borderRadius:18, padding:'16px 12px', background:'rgba(20,18,16,0.6)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.dim, padding:'0 8px 8px' }}>Inbox</div>
                {['New','Read','Replied','Archived'].map(f => (
                  <button key={f} onClick={() => { setMsgFolder(f); setOpenMsg(null) }} style={railBtn(msgFolder === f)}>
                    <span>{f}</span>
                    <span style={{ fontSize:11, color:'rgba(244,241,236,0.45)' }}>{messages.filter(m=>m.status===f).length}</span>
                  </button>
                ))}
              </aside>
              <div style={{ flex:'1 1 280px', minWidth:240, ...card }}>
                <h3 style={{ ...h3s, marginBottom:14 }}>{msgFolder}</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {folderMsgs.map(m => (
                    <button key={m.id} onClick={() => openMsgItem(m)} className="nm-h" style={{ display:'flex', gap:13, alignItems:'center', padding:14, borderRadius:13, cursor:'pointer', width:'100%', background:openMsg?.id===m.id?'rgba(200,146,60,0.12)':'rgba(255,255,255,0.025)', border:`1px solid ${openMsg?.id===m.id?'rgba(200,146,60,0.34)':'rgba(255,255,255,0.06)'}`, color:C.text }}>
                      <span style={{ width:38, height:38, flexShrink:0, borderRadius:'50%', background:'linear-gradient(135deg,#2a2620,#15120e)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:C.gold }}>{m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                      <span style={{ minWidth:0, flex:1, textAlign:'left' }}>
                        <span style={{ display:'block', fontSize:13, fontWeight:600, color:C.text }}>{m.name}</span>
                        <span style={{ display:'block', fontSize:12, color:C.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.body.slice(0,60)}</span>
                      </span>
                      <span style={{ fontSize:11, color:'rgba(244,241,236,0.4)', flexShrink:0 }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </button>
                  ))}
                  {folderMsgs.length === 0 && <div style={{ padding:34, textAlign:'center', fontSize:13, color:C.muted }}>No messages in this folder.</div>}
                </div>
              </div>
              {openMsg && (
                <div style={{ flex:'1 1 320px', minWidth:280, ...card, display:'flex', flexDirection:'column', gap:16, animation:'nmfade .3s ease both' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:13 }}>
                    <span style={{ width:44, height:44, flexShrink:0, borderRadius:'50%', background:'linear-gradient(135deg,#2a2620,#15120e)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:C.gold }}>{openMsg.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:600 }}>{openMsg.name}</div>
                      <a href={`mailto:${openMsg.email}`} className="nm-h" style={{ fontSize:12.5, color:C.goldL }}>{openMsg.email}</a>
                    </div>
                    <span style={{ fontSize:11, color:'rgba(244,241,236,0.45)' }}>{openMsg.status}</span>
                  </div>
                  <div style={{ fontSize:14, lineHeight:1.7, color:'rgba(244,241,236,0.82)', padding:16, borderRadius:13, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>{openMsg.body}</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <button onClick={() => { window.open(`mailto:${openMsg.email}`); setMsgStatus(openMsg.id,'Replied') }} className="nm-h" style={saveBtn}>Reply by email</button>
                    <button onClick={() => setMsgStatus(openMsg.id,'Archived')} className="nm-h" style={ghostBtn}>Archive</button>
                    <button onClick={() => setOpenMsg(null)} className="nm-h" style={ghostBtn}>Close</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HOMEPAGE EDITOR ── */}
          {screen === 'homepage' && (
            <div style={{ ...card, animation:'nmfade .5s ease both', display:'flex', flexDirection:'column', gap:15 }}>
              <h3 style={h3s}>Hero Section</h3>
              <div style={{ position:'relative', borderRadius:13, overflow:'hidden', aspectRatio:'21/9', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position:'absolute', inset:0, background:"url('/hero-clean.jpg') center 30%/cover" }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(7,6,5,0.9),transparent 72%)' }} />
                <div style={{ position:'absolute', left:20, bottom:18, right:20 }}>
                  <div style={{ fontSize:11, letterSpacing:'0.3em', color:C.gold }}>{hpEyebrow}</div>
                  <div style={{ fontFamily:'var(--font-jost)', fontWeight:200, fontSize:'clamp(20px,2.4vw,30px)', marginTop:7 }}>{hpTitle}</div>
                </div>
              </div>
              <div><label style={fLabel}>Eyebrow</label><input value={hpEyebrow} onChange={e => setHpEyebrow(e.target.value)} style={inp} /></div>
              <div><label style={fLabel}>Headline</label><input value={hpTitle} onChange={e => setHpTitle(e.target.value)} style={inp} /></div>
              <div><label style={fLabel}>Supporting text</label><textarea value={hpSub} onChange={e => setHpSub(e.target.value)} rows={3} style={{ ...inp, resize:'vertical' }} /></div>
              <div><button onClick={saveHomepage} className="nm-h" style={saveBtn}>{loading ? 'Saving…' : 'Save & Publish'}</button></div>
            </div>
          )}

          {/* ── ABOUT EDITOR ── */}
          {screen === 'about' && (
            <div style={{ ...card, animation:'nmfade .5s ease both', display:'flex', flexDirection:'column', gap:15 }}>
              <h3 style={h3s}>About & Story</h3>
              <div><label style={fLabel}>About Nic — bio (shown on Home & About)</label><textarea value={abBio} onChange={e => setAbBio(e.target.value)} rows={3} style={{ ...inp, resize:'vertical' }} /></div>
              <div><label style={fLabel}>Story title (Read My Story)</label><input value={abStoryTitle} onChange={e => setAbStoryTitle(e.target.value)} style={inp} /></div>
              <div><label style={fLabel}>Story — separate paragraphs with a blank line</label><textarea value={abStory} onChange={e => setAbStory(e.target.value)} rows={8} style={{ ...inp, resize:'vertical', lineHeight:1.6 }} /></div>
              <div><button onClick={saveAbout} className="nm-h" style={saveBtn}>{loading ? 'Saving…' : 'Save & Publish'}</button></div>
            </div>
          )}

          {/* ── PORTFOLIO / CATEGORIES ── */}
          {screen === 'portfolio' && (
            <div style={{ ...card, animation:'nmfade .5s ease both', display:'flex', flexDirection:'column', gap:16 }}>
              <h3 style={h3s}>Categories</h3>
              <p style={{ fontSize:13, color:C.muted, margin:0 }}>These appear as filters on the public Portfolio page. Add your own — nothing is locked to a fixed list.</p>
              <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
                {categories.map((c, i) => (
                  <span key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', borderRadius:10, background:'rgba(200,146,60,0.14)', border:'1px solid rgba(200,146,60,0.34)', color:C.goldL, fontSize:13 }}>
                    {c}
                    <button onClick={() => setCategories(prev => prev.filter((_,j)=>j!==i))} className="nm-h" style={{ background:'none', border:'none', color:'rgba(244,241,236,0.6)', cursor:'pointer', fontSize:16, lineHeight:1, padding:0 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, maxWidth:440 }}>
                <input value={catDraft} onChange={e => setCatDraft(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && catDraft.trim()) { setCategories(p=>[...p,catDraft.trim()]); setCatDraft('') }}} placeholder="Add a category…" style={inp} />
                <button onClick={() => { if(catDraft.trim()){ setCategories(p=>[...p,catDraft.trim()]); setCatDraft('') }}} className="nm-h" style={saveBtn}>Add</button>
              </div>
              <div><button onClick={saveCats} className="nm-h" style={ghostBtn}>{loading ? 'Saving…' : 'Save Categories'}</button></div>
            </div>
          )}

          {/* ── SEO ── */}
          {screen === 'seo' && (
            <div style={{ ...card, animation:'nmfade .5s ease both', display:'flex', flexDirection:'column', gap:15 }}>
              <h3 style={h3s}>Search & Sharing</h3>
              <p style={{ fontSize:13, color:C.muted, margin:0 }}>Plain-language controls. Sitemaps, Open Graph and structured data are generated automatically on the server.</p>
              <div><label style={fLabel}>Page title</label><input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} style={inp} /></div>
              <div><label style={fLabel}>Meta description</label><textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={3} style={{ ...inp, resize:'vertical' }} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                <div><label style={fLabel}>URL slug</label><input value={seoSlug} onChange={e => setSeoSlug(e.target.value)} style={inp} /></div>
                <div><label style={fLabel}>Canonical URL</label><input value={seoCanonical} onChange={e => setSeoCanonical(e.target.value)} style={inp} /></div>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 15px', borderRadius:12, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize:13.5, color:C.text }}>Search visibility</div>
                  <div style={{ fontSize:11.5, color:C.muted }}>Allow search engines to index this site</div>
                </div>
                <Toggle on={seoIndex} onClick={() => setSeoIndex(p=>!p)} />
              </div>
              <div><button onClick={saveSeo} className="nm-h" style={saveBtn}>{loading ? 'Saving…' : 'Save SEO'}</button></div>
            </div>
          )}

          {/* ── PRINT ROOM ── */}
          {screen === 'print' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'nmfade .5s ease both' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <h3 style={h3s}>Print Listings</h3>
                <div style={{ flex:1 }} />
                <button onClick={() => setPrints(p=>[...p,{id:Date.now(), title:'New Print', location:'', fromPrice:295, edition:'Open Edition', paper:'Hahnemühle Photo Rag®', featured:false, published:false, thumbUrl:null, externalUrl:null}])} className="nm-h" style={ghostBtn}>+ Add Print</button>
                <button onClick={savePrints} className="nm-h" style={saveBtn}>{loading ? 'Saving…' : 'Save & Publish'}</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
                {prints.map(p => (
                  <div key={p.id} style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(20,18,16,0.6)' }}>
                    <div style={{ position:'relative', aspectRatio:'3/2' }}>
                      {p.thumbUrl ? <img src={p.thumbUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.04)' }} />}
                    </div>
                    <div style={{ padding:16, display:'flex', flexDirection:'column', gap:9 }}>
                      <input value={p.title} onChange={e => setPrints(prev=>prev.map(x=>x.id===p.id?{...x,title:e.target.value}:x))} style={{ ...inp, fontFamily:'var(--font-jost)', fontSize:15 }} />
                      <input value={p.location||''} onChange={e => setPrints(prev=>prev.map(x=>x.id===p.id?{...x,location:e.target.value}:x))} placeholder="Location" style={inp} />
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, color:C.muted }}>From $</span>
                        <input value={p.fromPrice||''} onChange={e => setPrints(prev=>prev.map(x=>x.id===p.id?{...x,fromPrice:+e.target.value||0}:x))} style={{ ...inp, width:90 }} />
                      </div>
                      <div style={{ display:'flex', gap:18, paddingTop:9, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Toggle on={p.featured} onClick={() => setPrints(prev=>prev.map(x=>x.id===p.id?{...x,featured:!x.featured}:x))} />
                          <span style={{ fontSize:12, color:C.muted }}>Featured</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Toggle on={p.published} onClick={() => setPrints(prev=>prev.map(x=>x.id===p.id?{...x,published:!x.published}:x))} />
                          <span style={{ fontSize:12, color:C.muted }}>Published</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {prints.length === 0 && <div style={{ gridColumn:'1/-1', padding:'48px', textAlign:'center', fontSize:13, color:C.muted }}>No prints yet. Click + Add Print to create one.</div>}
              </div>
              <div style={{ fontSize:11.5, color:'rgba(244,241,236,0.42)', display:'flex', alignItems:'center', gap:7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>
                Full-resolution print files stay private. Checkout runs through your connected store (Pixieset).
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {screen === 'settings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'nmfade .5s ease both' }}>
              <div style={{ ...card, display:'flex', flexDirection:'column', gap:14 }}>
                <h3 style={h3s}>Contact & Social</h3>
                <div><label style={fLabel}>Contact email</label><input value={setEmail} onChange={e => setSetEmail(e.target.value)} style={inp} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                  <div><label style={fLabel}>Instagram username</label><input value={setIg} onChange={e => setSetIg(e.target.value)} style={inp} /></div>
                  <div><label style={fLabel}>Facebook username</label><input value={setFb} onChange={e => setSetFb(e.target.value)} style={inp} /></div>
                </div>
              </div>
              <div style={{ ...card, display:'flex', flexDirection:'column', gap:14 }}>
                <h3 style={h3s}>Footer & Store</h3>
                <div><label style={fLabel}>Footer copyright</label><input value={setCopyright} onChange={e => setSetCopyright(e.target.value)} style={inp} /></div>
                <div><label style={fLabel}>Print store URL (Pixieset)</label><input value={setStore} onChange={e => setSetStore(e.target.value)} style={inp} /></div>
              </div>
              <div style={{ ...card, display:'flex', flexDirection:'column', gap:14 }}>
                <h3 style={h3s}>Image & Session</h3>
                <div><label style={fLabel}>JPEG quality (60–100)</label><input type="number" value={setQuality} onChange={e => setSetQuality(+e.target.value)} style={{ ...inp, maxWidth:140 }} /></div>
                <div style={{ maxWidth:240 }}><label style={fLabel}>Session timeout (minutes)</label><input type="number" value={setSess} onChange={e => setSetSess(+e.target.value)} style={inp} /></div>
              </div>
              <div style={{ ...card, display:'flex', flexDirection:'column', gap:12 }}>
                <h3 style={h3s}>Security</h3>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, display:'flex', alignItems:'flex-start', gap:9 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8923c" strokeWidth="1.6" style={{ flexShrink:0, marginTop:2 }}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                  Your admin password is stored securely on the server as an environment variable — never in the website itself. Change it in Vercel → Settings → Environment Variables → ADMIN_PIN, then redeploy.
                </div>
              </div>
              <div><button onClick={saveSettings} className="nm-h" style={saveBtn}>{loading ? 'Saving…' : 'Save Settings'}</button></div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
