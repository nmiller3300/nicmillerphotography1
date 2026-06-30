'use client'

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Tab = 'photos' | 'collections' | 'prints' | 'content' | 'settings'

interface Photo {
  id: number; title: string; location?: string|null; status: string
  featured?: boolean; printEnabled?: boolean; homepage?: boolean
  orientation?: string; thumbUrl?: string|null
  caption?: string; alt?: string; camera?: string; captureDate?: string; description?: string
}
interface Msg { id: number; name: string; email: string; body: string; status: string; createdAt: string }
interface PrintItem {
  id: number; title: string; location?: string|null; fromPrice?: number|null
  featured: boolean; published: boolean; thumbUrl?: string|null
  externalUrl?: string|null; mediaId?: number|null
  edition?: string|null; paper?: string|null
}
interface Collection {
  id: number; title: string; slug: string; description?: string|null
  published: boolean; coverMediaId?: number|null; coverUrl?: string|null; itemCount?: number
}

const T='#f4f1ec', G='#c8923c', GL='#e3b463', MT='rgba(244,241,236,0.5)', BR='rgba(255,255,255,0.08)', S='rgba(16,14,12,0.65)'
const card: React.CSSProperties = { borderRadius:16, background:S, border:`1px solid ${BR}`, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }
const field: React.CSSProperties = { width:'100%', padding:'10px 13px', borderRadius:9, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.1)', color:T, fontFamily:'var(--font-manrope)', fontSize:13.5, outline:'none', boxSizing:'border-box' }
const lbl: React.CSSProperties = { display:'block', fontSize:10.5, letterSpacing:'0.06em', textTransform:'uppercase', color:MT, marginBottom:5 }
const primaryBtn: React.CSSProperties = { padding:'11px 22px', borderRadius:10, border:'1px solid rgba(200,146,60,0.5)', background:'linear-gradient(180deg,#d49a40,#b07c2e)', color:'#1a130a', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'var(--font-manrope)' }
const ghostBtn: React.CSSProperties = { padding:'10px 18px', borderRadius:10, border:`1px solid ${BR}`, background:'rgba(255,255,255,0.04)', color:T, fontSize:13, cursor:'pointer', fontFamily:'var(--font-manrope)' }

function Flag({ icon, label, on, onClick }: { icon: string; label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 13px', borderRadius:8, border:`1px solid ${on?'rgba(200,146,60,0.55)':'rgba(255,255,255,0.09)'}`, background:on?'rgba(200,146,60,0.16)':'rgba(255,255,255,0.03)', color:on?GL:'rgba(244,241,236,0.4)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-manrope)', fontWeight:on?600:400, transition:'all .18s' }}>
      <span style={{ fontSize:11 }}>{icon}</span>{label}
    </button>
  )
}
function StatusBadge({ status }: { status: string }) {
  const c: Record<string,[string,string]> = { published:['#5fb87a','rgba(95,184,122,0.15)'], draft:['#c8923c','rgba(200,146,60,0.12)'], archived:['#8aa0c8','rgba(138,160,200,0.12)'] }
  const [dot,bg] = c[status] ?? ['#888','rgba(136,136,136,0.12)']
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:6, background:bg, fontSize:11, fontWeight:600, color:dot }}><span style={{ width:5, height:5, borderRadius:'50%', background:dot }}/>{status}</span>
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('photos')
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<Array<{ name: string; done: boolean; error?: string }>>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const fileRef = useRef<HTMLInputElement>(null)
  const slotFileRef = useRef<HTMLInputElement>(null)
  const [pickerSearch, setPickerSearch] = useState('')

  const [photos, setPhotos] = useState<Photo[]>([])
  const [editing, setEditing] = useState<Photo|null>(null)
  const [ef, setEf] = useState({ title:'', location:'', caption:'', alt:'', captureDate:'', camera:'', description:'', featured:false, printEnabled:false, homepage:false })

  const [hpEyebrow, setHpEyebrow] = useState('BEYOND THE FRAME.')
  const [hpTitle, setHpTitle] = useState('A Different Way of Seeing Beauty.')
  const [hpSub, setHpSub] = useState('')
  const [abBio, setAbBio] = useState('')
  const [storyTitle, setStoryTitle] = useState('')
  const [story, setStory] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [catDraft, setCatDraft] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [openMsg, setOpenMsg] = useState<Msg|null>(null)
  const [prints, setPrints] = useState<PrintItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [editingCol, setEditingCol] = useState<Collection|null>(null)
  const [colItems, setColItems] = useState<Photo[]>([])         // photos in the collection being edited, in order
  const [colDesc, setColDesc] = useState('')
  const [colTitle, setColTitle] = useState('')
  const [colAddOpen, setColAddOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number|null>(null)     // collection item drag
  const [gridDragId, setGridDragId] = useState<number|null>(null) // photo grid drag
  const [pickerOpen, setPickerOpen] = useState<number|null>(null)

  const [heroUrl, setHeroUrl] = useState<string|null>(null)
  const [portraitUrl, setPortraitUrl] = useState<string|null>(null)
  const [storyUrl, setStoryUrl] = useState<string|null>(null)
  const [imgSlot, setImgSlot] = useState<'hero'|'portrait'|'story'|null>(null)

  const [stEmail, setStEmail] = useState('nmiller3300@gmail.com')
  const [stIg, setStIg] = useState('nicmiller.photography')
  const [stFb, setStFb] = useState('nicmiller.photography')
  const [stCopy, setStCopy] = useState('© 2026 Nic Miller Photography. All rights reserved.')
  const [stStore, setStStore] = useState('https://nicmillerphotography.pixieset.com')

  function toast$(m: string, err = false) { setToast(m); setToastErr(err); setTimeout(() => setToast(''), 3500) }

  async function api(method: string, path: string, body?: unknown) {
    const res = await fetch(path, { method, headers: body?{'Content-Type':'application/json'}:{}, body: body?JSON.stringify(body):undefined })
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(typeof e.error==='string'?e.error:`HTTP ${res.status}`) }
    return res.json()
  }

  const loadPhotos = useCallback(async () => {
    try { const r = await api('GET','/api/admin/media?sort=newest'); if(r.items) setPhotos(r.items) } catch {}
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const [mR, msgR, catsR, prR, contR, setR, colR] = await Promise.allSettled([
          api('GET','/api/admin/media?sort=manual'), api('GET','/api/admin/messages'),
          api('GET','/api/admin/categories'), api('GET','/api/admin/prints'),
          api('GET','/api/admin/content'), api('GET','/api/admin/settings'),
          api('GET','/api/admin/collections'),
        ])
        if(mR.status==='fulfilled'&&mR.value.items) setPhotos(mR.value.items)
        if(msgR.status==='fulfilled'&&msgR.value.items) setMsgs(msgR.value.items)
        if(catsR.status==='fulfilled'&&Array.isArray(catsR.value)) setCats(catsR.value.map((c:{name:string})=>c.name))
        if(prR.status==='fulfilled'&&Array.isArray(prR.value)) setPrints(prR.value)
        if(colR.status==='fulfilled'&&Array.isArray(colR.value)) setCollections(colR.value)
        if(contR.status==='fulfilled'){const c=contR.value;if(c.heroEyebrow)setHpEyebrow(c.heroEyebrow);if(c.heroTitle)setHpTitle(c.heroTitle);if(c.heroSubtitle)setHpSub(c.heroSubtitle);if(c.aboutBio)setAbBio(c.aboutBio);if(c.storyTitle)setStoryTitle(c.storyTitle);if(c.story&&Array.isArray(c.story))setStory(c.story.join('\n\n'));if(c.portraitUrl)setPortraitUrl(c.portraitUrl);if(c.storyImageUrl)setStoryUrl(c.storyImageUrl)}
        if(setR.status==='fulfilled'){const s=setR.value;if(s.email)setStEmail(s.email);if(s.instagram)setStIg(s.instagram);if(s.facebook)setStFb(s.facebook);if(s.copyright)setStCopy(s.copyright);if(s.storeUrl)setStStore(s.storeUrl)}
        try { const hR = await api('GET','/api/admin/media?status=homepage&sort=newest'); if(hR.items?.[0]?.thumbUrl) setHeroUrl(hR.items[0].thumbUrl) } catch {}
      } catch {}
    }
    init()
  }, [])

  async function processFiles(files: File[]) {
    if (!files.length) return
    setUploads(files.map(f => ({ name:f.name, done:false })))
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      const form = new FormData(); form.append('file', files[i])
      try {
        const res = await fetch('/api/admin/upload', { method:'POST', body:form })
        const data = await res.json()
        if (!res.ok) { setUploads(prev=>prev.map((u,j)=>j===i?{...u,error:data.error||'Failed'}:u)); if(data.code==='NO_BLOB_TOKEN'){toast$('Blob storage not connected',true);break} }
        else { setUploads(prev=>prev.map((u,j)=>j===i?{...u,done:true}:u)); ok++ }
      } catch(err) { setUploads(prev=>prev.map((u,j)=>j===i?{...u,error:String(err)}:u)) }
    }
    if (ok>0) { await loadPhotos(); toast$(`✓ ${ok} photo${ok>1?'s':''} uploaded`) }
    setTimeout(()=>setUploads([]), 3500)
  }
  function onDrop(e: DragEvent) { e.preventDefault(); setDragging(false); processFiles([...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'))) }
  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) { processFiles([...(e.target.files||[])]); e.target.value='' }

  function openEditor(p: Photo) {
    setEditing(p)
    setEf({ title:p.title, location:p.location||'', caption:p.caption||'', alt:p.alt||'', captureDate:p.captureDate||'', camera:p.camera||'', description:p.description||'', featured:p.featured||false, printEnabled:p.printEnabled||false, homepage:p.homepage||false })
  }
  async function savePhoto(status: 'draft'|'published') {
    if (!editing) return
    setLoading(true)
    try { await api('PATCH',`/api/admin/media/${editing.id}`,{...ef,status}); setPhotos(prev=>prev.map(p=>p.id===editing.id?{...p,...ef,status}:(ef.homepage?{...p,homepage:false}:p))); toast$(status==='published'?'✓ Published — live on your site':'✓ Saved as draft'); setEditing(null) }
    catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function deletePhoto() {
    if (!editing||!confirm('Delete this photo permanently?')) return
    setLoading(true)
    try { await api('DELETE',`/api/admin/media/${editing.id}?hard=true`); setPhotos(prev=>prev.filter(p=>p.id!==editing.id)); toast$('Photo deleted'); setEditing(null) }
    catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function setImageSlot(slot: 'hero'|'portrait'|'story', photo: Photo) {
    try {
      if (slot==='hero') { await api('PATCH',`/api/admin/media/${photo.id}`,{homepage:true,status:'published'}); setHeroUrl(photo.thumbUrl||null); setPhotos(prev=>prev.map(p=>({...p,homepage:p.id===photo.id}))); toast$('✓ Hero image updated') }
      else { const url=photo.thumbUrl||''; await api('PATCH','/api/admin/content',{[slot==='portrait'?'portraitUrl':'storyImageUrl']:url}); if(slot==='portrait')setPortraitUrl(url);else setStoryUrl(url); toast$(`✓ ${slot==='portrait'?'Portrait':'Story banner'} updated`) }
      setImgSlot(null)
    } catch(err){toast$(String(err),true)}
  }
  async function uploadToSlot(slot: 'hero'|'portrait'|'story', file: File) {
    setLoading(true)
    toast$('Uploading…')
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/admin/upload', { method:'POST', body:form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      await loadPhotos()
      const newId = data.id
      const url = data.thumbUrl || data.thumb_url || null
      if (slot==='hero') {
        await api('PATCH',`/api/admin/media/${newId}`,{homepage:true,status:'published'})
        setHeroUrl(url); toast$('✓ Hero uploaded & set')
      } else {
        await api('PATCH','/api/admin/content',{[slot==='portrait'?'portraitUrl':'storyImageUrl']:url||''})
        if(slot==='portrait')setPortraitUrl(url);else setStoryUrl(url)
        toast$(`✓ ${slot==='portrait'?'Portrait':'Story banner'} uploaded & set`)
      }
      setImgSlot(null)
    } catch(err){ toast$(String(err), true) }
    setLoading(false)
  }
  async function saveContent() {
    setLoading(true)
    try { await api('PATCH','/api/admin/content',{heroEyebrow:hpEyebrow,heroTitle:hpTitle,heroSubtitle:hpSub,aboutBio:abBio,storyTitle,story:story.split(/\n\n+/).map(s=>s.trim()).filter(Boolean)}); toast$('✓ Content saved') }
    catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function savePrints() {
    setLoading(true)
    try { await api('PATCH','/api/admin/prints',prints.map(p=>({...p,media_id:p.mediaId}))); toast$('✓ Prints saved') }
    catch(err){toast$(String(err),true)}
    setLoading(false)
  }

  // ── Collections ──
  async function reloadCollections() {
    try { const r = await api('GET','/api/admin/collections'); if(Array.isArray(r)) setCollections(r) } catch {}
  }
  async function createCollection() {
    setLoading(true)
    try {
      const r = await api('POST','/api/admin/collections',{ title:'New Series' })
      await reloadCollections()
      const fresh: Collection = { id:r.id, title:'New Series', slug:r.slug, published:false, itemCount:0 }
      openCollection(fresh)
      toast$('✓ Series created — add photos')
    } catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function openCollection(c: Collection) {
    setEditingCol(c); setColTitle(c.title); setColDesc(c.description||'')
    // Load its items in order
    try {
      const r = await api('GET',`/api/admin/collections`)
      // fetch items via a dedicated read: reuse media list + collection detail
      const detail = await fetch(`/api/admin/collections/${c.id}/items`).then(res=>res.ok?res.json():[]).catch(()=>[])
      if (Array.isArray(detail) && detail.length) {
        setColItems(detail.map((d:{id:number,title:string,thumbUrl:string|null,status:string})=>({ id:d.id, title:d.title, thumbUrl:d.thumbUrl, status:d.status })))
      } else { setColItems([]) }
      void r
    } catch { setColItems([]) }
  }
  async function saveCollection() {
    if (!editingCol) return
    setLoading(true)
    try {
      await api('PATCH','/api/admin/collections',{
        id: editingCol.id, title: colTitle, description: colDesc,
        items: colItems.map(p=>p.id),
      })
      await reloadCollections()
      toast$('✓ Series saved')
      setEditingCol(null)
    } catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function publishCollection(pub: boolean) {
    if (!editingCol) return
    setLoading(true)
    try {
      await api('PATCH','/api/admin/collections',{
        id: editingCol.id, title: colTitle, description: colDesc,
        items: colItems.map(p=>p.id), published: pub,
      })
      await reloadCollections()
      toast$(pub?'✓ Series published — live on your portfolio':'✓ Saved as draft')
      setEditingCol(null)
    } catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function deleteCollection() {
    if (!editingCol || !confirm('Delete this series? The photos stay in your library.')) return
    setLoading(true)
    try { await api('DELETE',`/api/admin/collections?id=${editingCol.id}`); await reloadCollections(); toast$('Series deleted'); setEditingCol(null) }
    catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  // Reorder items within collection editor (drag)
  function moveColItem(from: number, to: number) {
    setColItems(prev => { const a=[...prev]; const [m]=a.splice(from,1); a.splice(to,0,m); return a })
  }
  // Reorder the main photo grid (drag) and persist
  async function persistGridOrder(ordered: Photo[]) {
    setPhotos(ordered)
    try { await api('PATCH','/api/admin/media/reorder',{ order: ordered.map(p=>p.id) }) }
    catch(err){ toast$(String(err),true) }
  }

  async function saveSettings() {
    setLoading(true)
    try { await api('PATCH','/api/admin/settings',{email:stEmail,instagram:stIg,facebook:stFb,copyright:stCopy,storeUrl:stStore}); toast$('✓ Settings saved') }
    catch(err){toast$(String(err),true)}
    setLoading(false)
  }
  async function openMsgItem(m: Msg) {
    setOpenMsg(m)
    if (m.status==='New') { await api('PATCH',`/api/admin/messages/${m.id}`,{status:'Read'}).catch(()=>{}); setMsgs(prev=>prev.map(x=>x.id===m.id?{...x,status:'Read'}:x)) }
  }

  const newMsgs = msgs.filter(m=>m.status==='New').length
  const filtered = photos.filter(p => {
    const q=search.toLowerCase()
    const mq = !search || p.title.toLowerCase().includes(q) || (p.location||'').toLowerCase().includes(q)
    const mf = filter==='published'?p.status==='published':filter==='drafts'?p.status==='draft':filter==='featured'?p.featured:filter==='print'?p.printEnabled:filter==='homepage'?p.homepage:p.status!=='archived'
    return mq && mf
  })

  const tabStyle = (a: boolean): React.CSSProperties => ({ padding:'9px 20px', borderRadius:10, fontFamily:'var(--font-manrope)', fontSize:13.5, cursor:'pointer', border:`1px solid ${a?'rgba(200,146,60,0.4)':BR}`, background:a?'rgba(200,146,60,0.12)':'transparent', color:a?GL:MT, fontWeight:a?600:400 })
  const filterPill = (f: string, label: string) => (
    <button key={f} onClick={()=>setFilter(f)} style={{ padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-manrope)', fontSize:12.5, border:`1px solid ${filter===f?'rgba(200,146,60,0.45)':BR}`, background:filter===f?'rgba(200,146,60,0.12)':'rgba(255,255,255,0.02)', color:filter===f?GL:MT, fontWeight:filter===f?600:400 }}>{label}</button>
  )

  const IMG_SLOTS = [
    { key:'hero' as const, label:'Homepage Hero', sub:'Main background image', url:heroUrl },
    { key:'portrait' as const, label:'Your Portrait', sub:'About page & home strip', url:portraitUrl },
    { key:'story' as const, label:'Story Banner', sub:'My Story page header', url:storyUrl },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#080706', color:T, fontFamily:'var(--font-manrope)' }}>
      <header style={{ position:'sticky', top:0, zIndex:60, borderBottom:`1px solid ${BR}`, background:'rgba(8,7,6,0.94)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)' }}>
        <div style={{ maxWidth:1360, margin:'0 auto', padding:'0 28px', height:58, display:'flex', alignItems:'center', gap:16 }}>
          <Link href="/" style={{ flexShrink:0, lineHeight:0 }}><Image src="/nm-wordmark-white.png" alt="NM" width={108} height={28} style={{ height:28, width:'auto' }}/></Link>
          <div style={{ flex:1, display:'flex', justifyContent:'center', gap:5 }}>
            <button onClick={()=>setTab('photos')} style={tabStyle(tab==='photos')}>Photos</button>
            <button onClick={()=>setTab('collections')} style={tabStyle(tab==='collections')}>Series</button>
            <button onClick={()=>setTab('prints')} style={tabStyle(tab==='prints')}>Print Shop</button>
            <button onClick={()=>setTab('content')} style={tabStyle(tab==='content')}>Content {newMsgs>0&&<span style={{ marginLeft:5, padding:'1px 7px', borderRadius:8, background:G, color:'#1a130a', fontSize:10, fontWeight:700 }}>{newMsgs}</span>}</button>
            <button onClick={()=>setTab('settings')} style={tabStyle(tab==='settings')}>Settings</button>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={()=>fileRef.current?.click()} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7, padding:'8px 16px', fontSize:12.5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>Upload</button>
            <Link href="/" target="_blank" style={{ padding:'8px 13px', borderRadius:9, border:`1px solid ${BR}`, color:MT, fontSize:12, whiteSpace:'nowrap' }}>View site ↗</Link>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(200,146,60,0.18)', border:'1px solid rgba(200,146,60,0.28)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:G }}>NM</div>
          </div>
        </div>
      </header>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileInput} style={{ display:'none' }}/>
      <input ref={slotFileRef} type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f&&imgSlot)uploadToSlot(imgSlot,f); e.target.value='' }} style={{ display:'none' }}/>

      {/* ── Full-screen image picker for site-image slots ── */}
      {imgSlot && (
        <div onClick={()=>{setImgSlot(null);setPickerSearch('')}} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(5,4,3,0.86)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:880, maxHeight:'86vh', display:'flex', flexDirection:'column', borderRadius:18, background:'#0d0b0a', border:`1px solid ${BR}`, boxShadow:'0 40px 100px rgba(0,0,0,0.6)', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'18px 24px', borderBottom:`1px solid ${BR}`, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font-jost)', fontSize:18 }}>Set {imgSlot==='hero'?'Homepage Hero':imgSlot==='portrait'?'Your Portrait':'Story Banner'}</div>
                <div style={{ fontSize:12, color:MT, marginTop:2 }}>Upload a new photo or pick one from your library</div>
              </div>
              <button onClick={()=>slotFileRef.current?.click()} disabled={loading} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7, padding:'9px 16px', fontSize:12.5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
                Upload new
              </button>
              <button onClick={()=>{setImgSlot(null);setPickerSearch('')}} style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:`1px solid ${BR}`, color:T, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
              </button>
            </div>
            {/* Search */}
            <div style={{ padding:'14px 24px 0' }}>
              <div style={{ position:'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MT} strokeWidth="1.8" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>
                <input value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} placeholder="Search your photos…" style={{ ...field, paddingLeft:34 }}/>
              </div>
            </div>
            {/* Grid of ALL photos */}
            <div style={{ padding:24, overflowY:'auto', flex:1 }}>
              {(() => {
                const pool = photos.filter(p => p.thumbUrl && (!pickerSearch || p.title.toLowerCase().includes(pickerSearch.toLowerCase()) || (p.location||'').toLowerCase().includes(pickerSearch.toLowerCase())))
                if (pool.length === 0) return <div style={{ textAlign:'center', padding:'48px 20px', color:MT, fontSize:13.5 }}>No photos yet. Click &quot;Upload new&quot; above to add one.</div>
                return (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
                    {pool.map(p => (
                      <button key={p.id} onClick={()=>setImageSlot(imgSlot, p)} style={{ padding:0, border:`1px solid ${BR}`, borderRadius:10, overflow:'hidden', cursor:'pointer', background:'#12100e', position:'relative', textAlign:'left' }}>
                        <div style={{ position:'relative', aspectRatio:'4/3' }}>
                          <img src={p.thumbUrl!} alt="" loading="lazy" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                          {p.status!=='published' && <span style={{ position:'absolute', top:6, left:6, fontSize:9, padding:'2px 7px', borderRadius:5, background:'rgba(8,7,6,0.8)', color:G }}>draft</span>}
                        </div>
                        <div style={{ padding:'7px 9px', fontSize:11.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:200, padding:'11px 22px', borderRadius:12, background:'rgba(12,10,8,0.97)', border:`1px solid ${toastErr?'rgba(224,90,90,0.4)':'rgba(200,146,60,0.35)'}`, color:toastErr?'#e05a5a':GL, fontSize:13.5, boxShadow:'0 12px 40px rgba(0,0,0,0.6)', whiteSpace:'nowrap', maxWidth:'92vw' }}>{toast}</div>}

      {uploads.length>0 && <div style={{ position:'fixed', bottom:68, right:24, zIndex:200, display:'flex', flexDirection:'column', gap:6, width:260 }}>{uploads.map((u,i)=>(
        <div key={i} style={{ padding:'9px 13px', borderRadius:10, background:'rgba(12,10,8,0.96)', border:`1px solid ${u.error?'rgba(224,90,90,0.35)':u.done?'rgba(95,184,122,0.35)':BR}`, position:'relative', overflow:'hidden' }}>
          {!u.done&&!u.error&&<div style={{ position:'absolute', bottom:0, left:0, height:2, background:G, animation:'progress 2s ease-in-out infinite' }}/>}
          <div style={{ fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.name}</div>
          <div style={{ fontSize:11, marginTop:2, color:u.error?'#e05a5a':u.done?'#5fb87a':MT }}>{u.error||(u.done?'✓ Done':'Uploading…')}</div>
        </div>
      ))}</div>}

      <div style={{ maxWidth:1360, margin:'0 auto', padding:'28px 28px 80px' }}>

        {tab==='photos' && !editing && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12 }}>
              {[['Published',photos.filter(p=>p.status==='published').length,'#5fb87a'],['Drafts',photos.filter(p=>p.status==='draft').length,G],['Total',photos.length,'#8aa0c8'],['Messages',msgs.length,newMsgs>0?G:'#8aa0c8']].map(([label,count,color])=>(
                <div key={label as string} style={{ ...card, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:color as string, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:12.5, color:MT }}>{label}</span>
                  <span style={{ fontFamily:'var(--font-jost)', fontSize:26, lineHeight:1 }}>{count}</span>
                </div>
              ))}
            </div>
            <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={onDrop} onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${dragging?G:'rgba(255,255,255,0.1)'}`, borderRadius:14, padding:'32px 24px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(200,146,60,0.04)':'transparent', transition:'all .2s' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={dragging?G:'rgba(255,255,255,0.22)'} strokeWidth="1.6" style={{ display:'block', margin:'0 auto 10px' }}><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>
              <div style={{ fontSize:13.5, color:dragging?GL:MT }}>{dragging?'Drop to upload':'Drag photos here, or click to browse'}</div>
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.22)', marginTop:4 }}>JPEG · PNG · WEBP · up to 50 MB each</div>
            </div>
            {photos.length>0 && (
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ position:'relative', flex:'0 1 240px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MT} strokeWidth="1.8" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ ...field, paddingLeft:32 }}/>
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>{filterPill('all','All')}{filterPill('published','Published')}{filterPill('drafts','Drafts')}{filterPill('featured','Featured')}{filterPill('homepage','Hero')}{filterPill('print','For Sale')}</div>
                {photos.filter(p=>p.status==='draft').length>0 && <button onClick={async()=>{const d=photos.filter(p=>p.status==='draft');if(!confirm(`Publish all ${d.length} drafts?`))return;setLoading(true);for(const p of d){try{await api('PATCH',`/api/admin/media/${p.id}`,{status:'published'})}catch{}}await loadPhotos();toast$('✓ All drafts published');setLoading(false)}} style={{ ...ghostBtn, marginLeft:'auto', fontSize:12, color:GL, borderColor:'rgba(200,146,60,0.25)' }}>Publish all drafts ({photos.filter(p=>p.status==='draft').length})</button>}
              </div>
            )}
            {filter==='all' && !search && photos.length>1 && (
              <div style={{ fontSize:11.5, color:MT, display:'flex', alignItems:'center', gap:7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.6"><path d="M5 9h14M5 15h14"/><path d="m8 6-3 3 3 3M16 18l3-3-3-3"/></svg>
                Drag photos to set the order they appear on your portfolio.
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12 }}>
              {filtered.map((p, idx)=>{
                const canDrag = filter==='all' && !search
                return (
                <button
                  key={p.id}
                  onClick={()=>openEditor(p)}
                  draggable={canDrag}
                  onDragStart={canDrag?()=>setGridDragId(p.id):undefined}
                  onDragOver={canDrag?(e)=>e.preventDefault():undefined}
                  onDrop={canDrag?async(e)=>{
                    e.preventDefault()
                    if(gridDragId===null||gridDragId===p.id){setGridDragId(null);return}
                    const arr=[...photos]
                    const from=arr.findIndex(x=>x.id===gridDragId)
                    const to=arr.findIndex(x=>x.id===p.id)
                    if(from<0||to<0){setGridDragId(null);return}
                    const [m]=arr.splice(from,1); arr.splice(to,0,m)
                    setGridDragId(null)
                    await persistGridOrder(arr)
                  }:undefined}
                  style={{ padding:0, border:`1px solid ${gridDragId===p.id?'rgba(200,146,60,0.5)':BR}`, borderRadius:13, overflow:'hidden', cursor:canDrag?'grab':'pointer', background:'#100e0c', color:T, textAlign:'left', display:'flex', flexDirection:'column', opacity:gridDragId===p.id?0.5:1 }}
                >
                  <div style={{ position:'relative', aspectRatio:'4/3', width:'100%', overflow:'hidden' }}>
                    {p.thumbUrl?<img src={p.thumbUrl} alt="" loading="lazy" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>:<div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.4"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg></div>}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.55))' }}/>
                    <div style={{ position:'absolute', top:8, left:8 }}><StatusBadge status={p.status}/></div>
                    <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:4 }}>
                      {p.featured&&<span style={{ width:20, height:20, borderRadius:5, background:'rgba(8,7,6,0.75)', display:'flex', alignItems:'center', justifyContent:'center', color:GL, fontSize:10 }}>★</span>}
                      {p.homepage&&<span style={{ width:20, height:20, borderRadius:5, background:'rgba(8,7,6,0.75)', display:'flex', alignItems:'center', justifyContent:'center', color:GL, fontSize:10 }}>⌂</span>}
                      {p.printEnabled&&<span style={{ width:20, height:20, borderRadius:5, background:'rgba(8,7,6,0.75)', display:'flex', alignItems:'center', justifyContent:'center', color:GL, fontSize:10 }}>$</span>}
                    </div>
                  </div>
                  <div style={{ padding:'9px 11px' }}>
                    <div style={{ fontSize:12.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize:11, color:MT, marginTop:2 }}>{p.location||p.orientation||'—'}</div>
                  </div>
                </button>
              )})}
            </div>
            {filtered.length===0&&photos.length>0&&<div style={{ textAlign:'center', padding:'48px 20px', color:MT, fontSize:14 }}>No photos match this filter.</div>}
          </div>
        )}

        {tab==='photos' && editing && (
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
            <button onClick={()=>setEditing(null)} style={{ display:'flex', alignItems:'center', gap:6, alignSelf:'flex-start', background:'none', border:'none', color:MT, fontSize:13, cursor:'pointer', fontFamily:'var(--font-manrope)', padding:0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>Back to photos</button>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24, alignItems:'start' }}>
              <div style={{ ...card, overflow:'hidden' }}>
                {editing.thumbUrl?<img src={editing.thumbUrl} alt="" style={{ width:'100%', display:'block', maxHeight:'68vh', objectFit:'contain', background:'#0e0c0a' }}/>:<div style={{ aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center', background:'#0e0c0a' }}><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg></div>}
                <div style={{ padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}><StatusBadge status={editing.status}/><span style={{ fontSize:11.5, color:MT }}>{editing.orientation||'—'}</span><span style={{ fontSize:11.5, color:'rgba(255,255,255,0.25)' }}>· master preserved</span></div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div><label style={lbl}>Title</label><input value={ef.title} onChange={e=>setEf(p=>({...p,title:e.target.value}))} style={{ ...field, fontSize:17, fontFamily:'var(--font-jost)', fontWeight:300 }}/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
                  <div><label style={lbl}>Location</label><input value={ef.location} onChange={e=>setEf(p=>({...p,location:e.target.value}))} placeholder="e.g. NC Zoo" style={field}/></div>
                  <div><label style={lbl}>Capture date</label><input value={ef.captureDate} onChange={e=>setEf(p=>({...p,captureDate:e.target.value}))} style={field}/></div>
                </div>
                <div><label style={lbl}>Camera & lens</label><input value={ef.camera} onChange={e=>setEf(p=>({...p,camera:e.target.value}))} style={field}/></div>
                <div><label style={lbl}>Caption</label><input value={ef.caption} onChange={e=>setEf(p=>({...p,caption:e.target.value}))} style={field}/></div>
                <div><label style={lbl}>Alt text</label><input value={ef.alt} onChange={e=>setEf(p=>({...p,alt:e.target.value}))} style={field}/></div>
                <div><label style={lbl}>Description / story</label><textarea value={ef.description} onChange={e=>setEf(p=>({...p,description:e.target.value}))} rows={3} style={{ ...field, resize:'vertical' }}/></div>
                <div>
                  <label style={{ ...lbl, marginBottom:8 }}>Flags</label>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                    <Flag icon="★" label="Featured" on={ef.featured} onClick={()=>setEf(p=>({...p,featured:!p.featured}))}/>
                    <Flag icon="⌂" label="Homepage hero" on={ef.homepage} onClick={()=>setEf(p=>({...p,homepage:!p.homepage}))}/>
                    <Flag icon="$" label="For sale" on={ef.printEnabled} onClick={()=>setEf(p=>({...p,printEnabled:!p.printEnabled}))}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, paddingTop:6 }}>
                  <button onClick={()=>savePhoto('draft')} style={ghostBtn} disabled={loading}>Save draft</button>
                  <button onClick={()=>savePhoto('published')} disabled={loading} style={{ ...primaryBtn, flex:1 }}>Publish to site →</button>
                </div>
                <button onClick={deletePhoto} disabled={loading} style={{ padding:'9px', borderRadius:10, border:'1px solid rgba(224,90,90,0.25)', background:'rgba(224,90,90,0.04)', color:'rgba(224,90,90,0.7)', fontSize:12.5, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>Delete permanently</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ SERIES / COLLECTIONS TAB ══════════════════ */}
        {tab==='collections' && !editingCol && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:'var(--font-jost)', fontSize:22 }}>Series</div>
                <div style={{ fontSize:13, color:MT, marginTop:3 }}>Group related shots — like a multi-part wildlife session — into an ordered set.</div>
              </div>
              <button onClick={createCollection} disabled={loading} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
                New Series
              </button>
            </div>
            {collections.length===0 && (
              <div style={{ ...card, padding:'48px 24px', textAlign:'center' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" style={{ margin:'0 auto 14px', display:'block' }}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                <div style={{ fontSize:14.5, color:T, marginBottom:6 }}>No series yet</div>
                <div style={{ fontSize:13, color:MT, maxWidth:380, margin:'0 auto' }}>Create a series to keep a shoot together — for example your three-part Great Blue Heron set — instead of scattering them across the portfolio.</div>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
              {collections.map(c=>(
                <button key={c.id} onClick={()=>openCollection(c)} style={{ padding:0, border:`1px solid ${BR}`, borderRadius:14, overflow:'hidden', cursor:'pointer', background:'#100e0c', color:T, textAlign:'left', display:'flex', flexDirection:'column' }}>
                  <div style={{ position:'relative', aspectRatio:'3/2', background:'#12100e' }}>
                    {c.coverUrl?<img src={c.coverUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>:<div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg></div>}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.6))' }}/>
                    <div style={{ position:'absolute', top:8, left:8 }}><StatusBadge status={c.published?'published':'draft'}/></div>
                  </div>
                  <div style={{ padding:'11px 13px' }}>
                    <div style={{ fontSize:14, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title}</div>
                    <div style={{ fontSize:11.5, color:MT, marginTop:2 }}>{c.itemCount||0} photo{(c.itemCount||0)===1?'':'s'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Series editor ── */}
        {tab==='collections' && editingCol && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <button onClick={()=>setEditingCol(null)} style={{ display:'flex', alignItems:'center', gap:6, alignSelf:'flex-start', background:'none', border:'none', color:MT, fontSize:13, cursor:'pointer', fontFamily:'var(--font-manrope)', padding:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18 9 12l6-6"/></svg>
              Back to series
            </button>

            <div style={{ ...card, padding:24, display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lbl}>Series title</label><input value={colTitle} onChange={e=>setColTitle(e.target.value)} placeholder="e.g. The Great Blue Heron" style={{ ...field, fontSize:16, fontFamily:'var(--font-jost)', fontWeight:300 }}/></div>
              <div><label style={lbl}>Description (optional)</label><textarea value={colDesc} onChange={e=>setColDesc(e.target.value)} rows={2} placeholder="A few words about this shoot…" style={{ ...field, resize:'vertical' }}/></div>
            </div>

            {/* Ordered items with drag */}
            <div style={{ ...card, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-jost)', fontSize:18 }}>Photos in this series</div>
                  <div style={{ fontSize:12, color:MT, marginTop:3 }}>Drag to reorder. The first photo becomes the cover.</div>
                </div>
                <button onClick={()=>setColAddOpen(true)} style={ghostBtn}>+ Add photos</button>
              </div>
              {colItems.length===0
                ? <div style={{ fontSize:13, color:MT, padding:'20px 0' }}>No photos yet. Click &quot;Add photos&quot; to choose from your library.</div>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
                    {colItems.map((p,idx)=>(
                      <div
                        key={p.id}
                        draggable
                        onDragStart={()=>setDragIdx(idx)}
                        onDragOver={e=>e.preventDefault()}
                        onDrop={e=>{e.preventDefault(); if(dragIdx!==null&&dragIdx!==idx)moveColItem(dragIdx,idx); setDragIdx(null)}}
                        style={{ position:'relative', border:`1px solid ${dragIdx===idx?'rgba(200,146,60,0.5)':BR}`, borderRadius:11, overflow:'hidden', background:'#12100e', cursor:'grab', opacity:dragIdx===idx?0.5:1 }}
                      >
                        <div style={{ position:'relative', aspectRatio:'4/3' }}>
                          {p.thumbUrl&&<img src={p.thumbUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>}
                          <div style={{ position:'absolute', top:6, left:6, width:22, height:22, borderRadius:6, background:'rgba(200,146,60,0.92)', color:'#1a130a', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{idx+1}</div>
                          <button onClick={()=>setColItems(prev=>prev.filter(x=>x.id!==p.id))} style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:6, background:'rgba(8,7,6,0.8)', border:'none', color:'rgba(224,90,90,0.9)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>×</button>
                        </div>
                        <div style={{ padding:'7px 9px', fontSize:11.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={()=>publishCollection(false)} style={ghostBtn} disabled={loading}>Save as draft</button>
              <button onClick={()=>publishCollection(true)} style={{ ...primaryBtn, flex:1, minWidth:180 }} disabled={loading}>Publish series to portfolio →</button>
            </div>
            <button onClick={deleteCollection} disabled={loading} style={{ padding:'9px', borderRadius:10, border:'1px solid rgba(224,90,90,0.25)', background:'rgba(224,90,90,0.04)', color:'rgba(224,90,90,0.7)', fontSize:12.5, cursor:'pointer', fontFamily:'var(--font-manrope)', alignSelf:'flex-start', paddingLeft:20, paddingRight:20 }}>Delete series</button>

            {/* Add-photos modal */}
            {colAddOpen && (
              <div onClick={()=>setColAddOpen(false)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(5,4,3,0.86)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
                <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:880, maxHeight:'86vh', display:'flex', flexDirection:'column', borderRadius:18, background:'#0d0b0a', border:`1px solid ${BR}`, overflow:'hidden' }}>
                  <div style={{ padding:'18px 24px', borderBottom:`1px solid ${BR}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontFamily:'var(--font-jost)', fontSize:18 }}>Add photos to series</div>
                    <button onClick={()=>setColAddOpen(false)} style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:`1px solid ${BR}`, color:T, cursor:'pointer' }}>✕</button>
                  </div>
                  <div style={{ padding:24, overflowY:'auto' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
                      {photos.filter(p=>p.thumbUrl).map(p=>{
                        const inSet = colItems.some(x=>x.id===p.id)
                        return (
                          <button key={p.id} onClick={()=>{ if(inSet)setColItems(prev=>prev.filter(x=>x.id!==p.id)); else setColItems(prev=>[...prev,{id:p.id,title:p.title,thumbUrl:p.thumbUrl,status:p.status}]) }} style={{ padding:0, border:`2px solid ${inSet?G:'transparent'}`, borderRadius:10, overflow:'hidden', cursor:'pointer', background:'#12100e', position:'relative', textAlign:'left' }}>
                            <div style={{ position:'relative', aspectRatio:'4/3' }}>
                              <img src={p.thumbUrl!} alt="" loading="lazy" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                              {inSet && <div style={{ position:'absolute', inset:0, background:'rgba(200,146,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GL} strokeWidth="2.5"><path d="m5 12 5 5L20 6"/></svg></div>}
                            </div>
                            <div style={{ padding:'7px 9px', fontSize:11.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ padding:'14px 24px', borderTop:`1px solid ${BR}`, display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={()=>setColAddOpen(false)} style={primaryBtn}>Done ({colItems.length} selected)</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='content' && (
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
            <div style={{ ...card, padding:28 }}>
              <div style={{ fontFamily:'var(--font-jost)', fontSize:20, marginBottom:4 }}>Site Images</div>
              <div style={{ fontSize:13, color:MT, marginBottom:22 }}>The three photos used across your site. Upload a new one or choose from your library.</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
                {IMG_SLOTS.map(({key,label,sub,url})=>(
                  <div key={key} style={{ border:`1px solid ${BR}`, borderRadius:13, overflow:'hidden', background:'#100e0c' }}>
                    <div style={{ position:'relative', aspectRatio:'4/3' }}>
                      {url?<img src={url} alt={label} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>:<div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7 }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg><span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>Not set</span></div>}
                    </div>
                    <div style={{ padding:'11px 13px' }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:11, color:MT, marginBottom:10 }}>{sub}</div>
                      <button onClick={()=>setImgSlot(key)} style={{ width:'100%', padding:'7px', borderRadius:8, border:`1px solid ${BR}`, background:'rgba(255,255,255,0.03)', color:MT, fontSize:12.5, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>{url?'↕ Change image':'+ Set image'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card, padding:28 }}>
              <div style={{ fontFamily:'var(--font-jost)', fontSize:20, marginBottom:4 }}>Homepage Text</div>
              <div style={{ fontSize:13, color:MT, marginBottom:20 }}>The words on your hero section.</div>
              <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <div><label style={lbl}>Eyebrow — small gold text above headline</label><input value={hpEyebrow} onChange={e=>setHpEyebrow(e.target.value)} style={field}/></div>
                <div><label style={lbl}>Headline</label><input value={hpTitle} onChange={e=>setHpTitle(e.target.value)} style={field}/></div>
                <div><label style={lbl}>Supporting text</label><textarea value={hpSub} onChange={e=>setHpSub(e.target.value)} rows={2} style={{ ...field, resize:'vertical' }}/></div>
              </div>
            </div>

            <div style={{ ...card, padding:28 }}>
              <div style={{ fontFamily:'var(--font-jost)', fontSize:20, marginBottom:18 }}>About & Story</div>
              <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <div><label style={lbl}>Bio — shown on Home and About pages</label><textarea value={abBio} onChange={e=>setAbBio(e.target.value)} rows={3} style={{ ...field, resize:'vertical' }}/></div>
                <div><label style={lbl}>Story title</label><input value={storyTitle} onChange={e=>setStoryTitle(e.target.value)} style={field}/></div>
                <div><label style={lbl}>Story — blank line between paragraphs</label><textarea value={story} onChange={e=>setStory(e.target.value)} rows={7} style={{ ...field, resize:'vertical', lineHeight:1.7 }}/></div>
              </div>
            </div>

            <div style={{ ...card, padding:28 }}>
              <div style={{ fontFamily:'var(--font-jost)', fontSize:20, marginBottom:6 }}>Portfolio Categories</div>
              <div style={{ fontSize:13, color:MT, marginBottom:16 }}>Filter chips shown on the Portfolio page.</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                {cats.map((c,i)=>(<span key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 12px', borderRadius:8, background:'rgba(200,146,60,0.1)', border:'1px solid rgba(200,146,60,0.28)', color:GL, fontSize:13 }}>{c}<button onClick={()=>setCats(prev=>prev.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:MT, cursor:'pointer', fontSize:15, lineHeight:1, padding:0 }}>×</button></span>))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input value={catDraft} onChange={e=>setCatDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&catDraft.trim()){setCats(p=>[...p,catDraft.trim()]);setCatDraft('')}}} placeholder="Add category…" style={{ ...field, maxWidth:240 }}/>
                <button onClick={()=>{if(catDraft.trim()){setCats(p=>[...p,catDraft.trim()]);setCatDraft('')}}} style={ghostBtn}>Add</button>
              </div>
            </div>

            <button onClick={saveContent} disabled={loading} style={{ ...primaryBtn, alignSelf:'flex-start' }}>{loading?'Saving…':'Save Content'}</button>

            <div style={{ ...card, padding:28 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontFamily:'var(--font-jost)', fontSize:20 }}>Messages</div>
                <span style={{ fontSize:13, color:MT }}>{msgs.length} total{newMsgs>0?` · ${newMsgs} unread`:''}</span>
              </div>
              {msgs.length===0?<div style={{ fontSize:13, color:MT }}>No messages yet.</div>:
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto' }}>
                  {msgs.map(m=>(
                    <button key={m.id} onClick={()=>openMsgItem(m)} style={{ display:'flex', gap:12, alignItems:'center', padding:'13px 15px', borderRadius:11, cursor:'pointer', width:'100%', background:openMsg?.id===m.id?'rgba(200,146,60,0.07)':'rgba(255,255,255,0.02)', border:`1px solid ${openMsg?.id===m.id?'rgba(200,146,60,0.22)':BR}`, color:T, fontFamily:'var(--font-manrope)', textAlign:'left' }}>
                      <span style={{ width:34, height:34, flexShrink:0, borderRadius:'50%', background:'rgba(200,146,60,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11.5, fontWeight:700, color:G }}>{m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                      <span style={{ flex:1, minWidth:0 }}><span style={{ display:'block', fontSize:13.5, fontWeight:600 }}>{m.name}</span><span style={{ display:'block', fontSize:12, color:MT, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.body.slice(0,70)}</span></span>
                      {m.status==='New'&&<span style={{ width:7, height:7, borderRadius:'50%', background:G, flexShrink:0 }}/>}
                    </button>
                  ))}
                </div>}
              {openMsg && <div style={{ marginTop:16, padding:20, borderRadius:13, background:'rgba(200,146,60,0.04)', border:'1px solid rgba(200,146,60,0.15)' }}>
                <div style={{ fontWeight:600, marginBottom:3 }}>{openMsg.name}</div>
                <a href={`mailto:${openMsg.email}`} style={{ fontSize:12.5, color:GL, display:'block', marginBottom:14 }}>{openMsg.email}</a>
                <div style={{ fontSize:14, lineHeight:1.75, color:'rgba(244,241,236,0.8)', marginBottom:16, whiteSpace:'pre-wrap' }}>{openMsg.body}</div>
                <div style={{ display:'flex', gap:10 }}><a href={`mailto:${openMsg.email}`} style={{ ...primaryBtn, textDecoration:'none' }}>Reply by email</a><button onClick={()=>setOpenMsg(null)} style={ghostBtn}>Close</button></div>
              </div>}
            </div>
          </div>
        )}

        {/* ══════════════════════ PRINT SHOP TAB ══════════════════════════ */}
        {tab==='prints' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:'var(--font-jost)', fontSize:22 }}>Print Shop</div>
                <div style={{ fontSize:13, color:MT, marginTop:3, maxWidth:560, lineHeight:1.6 }}>Manage which photos are sold as prints. Each listing points to its Pixieset checkout page. The <span style={{ color:GL }}>★ featured</span> print appears in the hero card on your homepage.</div>
              </div>
              <button onClick={()=>setPrints(p=>[...p,{id:Date.now(),title:'New Print',location:'',fromPrice:225,featured:false,published:false,externalUrl:null,mediaId:null}])} style={{ ...primaryBtn, display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
                Add listing
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
              {[
                ['Total listings', prints.length, '#8aa0c8'],
                ['Live on site', prints.filter(p=>p.published).length, '#5fb87a'],
                ['Featured', prints.filter(p=>p.featured).length, G],
              ].map(([label,count,color])=>(
                <div key={label as string} style={{ ...card, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:color as string, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:12.5, color:MT }}>{label}</span>
                  <span style={{ fontFamily:'var(--font-jost)', fontSize:24, lineHeight:1 }}>{count as number}</span>
                </div>
              ))}
            </div>

            {prints.length>1 && prints.filter(p=>p.featured).length>1 && (
              <div style={{ padding:'10px 16px', borderRadius:10, background:'rgba(224,90,90,0.08)', border:'1px solid rgba(224,90,90,0.25)', fontSize:12.5, color:'#e0917a' }}>
                You have more than one featured print. Only the first will show on the homepage — pick just one.
              </div>
            )}

            {prints.length===0 && (
              <div style={{ ...card, padding:'48px 24px', textAlign:'center' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" style={{ margin:'0 auto 14px', display:'block' }}><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>
                <div style={{ fontSize:14.5, color:T, marginBottom:6 }}>No prints listed yet</div>
                <div style={{ fontSize:13, color:MT, maxWidth:400, margin:'0 auto' }}>Click &quot;Add listing&quot; to put a photo up for sale. You&#39;ll pick the photo, set a starting price, and paste its Pixieset checkout link.</div>
              </div>
            )}

            {/* Listings */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {prints.map((p,idx)=>(
                <div key={p.id} style={{ ...card, overflow:'hidden' }}>
                  {/* Row header: thumbnail + identity + status */}
                  <div style={{ display:'flex', gap:14, alignItems:'center', padding:'16px 18px', borderBottom:`1px solid ${BR}` }}>
                    <span style={{ fontFamily:'var(--font-jost)', fontSize:15, color:MT, width:20, textAlign:'center', flexShrink:0 }}>{idx+1}</span>
                    {p.thumbUrl
                      ? <div style={{ width:72, height:54, flexShrink:0, borderRadius:9, background:`url('${p.thumbUrl}') center/cover`, border:`1px solid ${BR}` }}/>
                      : <div style={{ width:72, height:54, flexShrink:0, borderRadius:9, background:'rgba(255,255,255,0.04)', border:`1px dashed rgba(255,255,255,0.12)`, display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg></div>
                    }
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title||'Untitled print'}</div>
                      <div style={{ fontSize:12.5, color:MT, marginTop:2 }}>{p.location||'No location'} · from ${p.fromPrice||0}</div>
                    </div>
                    <div style={{ display:'flex', gap:7, alignItems:'center', flexShrink:0 }}>
                      {p.featured && <span style={{ fontSize:10.5, padding:'4px 10px', borderRadius:6, background:'rgba(200,146,60,0.16)', color:GL, fontWeight:600 }}>★ Featured</span>}
                      <span style={{ fontSize:10.5, padding:'4px 10px', borderRadius:6, background:p.published?'rgba(95,184,122,0.15)':'rgba(255,255,255,0.05)', color:p.published?'#5fb87a':MT, fontWeight:600 }}>{p.published?'● Live':'Draft'}</span>
                    </div>
                  </div>

                  {/* Photo picker */}
                  <div style={{ padding:'14px 18px', borderBottom:`1px solid ${BR}`, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <button onClick={()=>setPickerOpen(pickerOpen===p.id?null:p.id)} style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${pickerOpen===p.id?'rgba(200,146,60,0.4)':BR}`, background:pickerOpen===p.id?'rgba(200,146,60,0.1)':'rgba(255,255,255,0.03)', color:pickerOpen===p.id?GL:T, fontSize:12.5, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>{p.thumbUrl?'↕ Change photo':'+ Choose photo from library'}</button>
                    {p.thumbUrl && <span style={{ fontSize:11.5, color:MT }}>Title & location auto-fill from the photo — edit below if needed.</span>}
                  </div>
                  {pickerOpen===p.id && (
                    <div style={{ padding:14, borderBottom:`1px solid ${BR}`, background:'rgba(0,0,0,0.18)' }}>
                      <div style={{ fontSize:11.5, color:MT, marginBottom:10 }}>Select a photo:</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))', gap:8, maxHeight:260, overflowY:'auto' }}>
                        {photos.filter(ph=>ph.thumbUrl).map(ph=>(
                          <button key={ph.id} onClick={()=>{
                            setPrints(prev=>prev.map(x=>x.id===p.id?{
                              ...x,
                              thumbUrl:ph.thumbUrl, mediaId:ph.id,
                              // Auto-fill title/location from the photo if they're still default/empty
                              title: (!x.title || x.title==='New Print') ? ph.title : x.title,
                              location: (!x.location) ? (ph.location||'') : x.location,
                            }:x))
                            setPickerOpen(null)
                          }} style={{ padding:0, border:`2px solid ${p.mediaId===ph.id?G:'transparent'}`, borderRadius:8, overflow:'hidden', cursor:'pointer', position:'relative', background:'#12100e', textAlign:'left' }}>
                            <div style={{ position:'relative', aspectRatio:'4/3' }}>
                              <img src={ph.thumbUrl!} alt="" loading="lazy" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                              {p.mediaId===ph.id && <div style={{ position:'absolute', inset:0, background:'rgba(200,146,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GL} strokeWidth="2.5"><path d="m5 12 5 5L20 6"/></svg></div>}
                            </div>
                            <div style={{ padding:'6px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ph.title}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detail fields */}
                  <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:13 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr auto', gap:11 }}>
                      <div><label style={lbl}>Print title</label><input value={p.title} onChange={e=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,title:e.target.value}:x))} placeholder="e.g. Golden Orb Weaver" style={field}/></div>
                      <div><label style={lbl}>Location</label><input value={p.location||''} onChange={e=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,location:e.target.value}:x))} placeholder="e.g. Chattahoochee River" style={field}/></div>
                      <div><label style={lbl}>From price</label><div style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ fontSize:13, color:MT }}>$</span><input type="number" value={p.fromPrice||''} onChange={e=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,fromPrice:+e.target.value}:x))} style={{ ...field, width:90 }}/></div></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
                      <div><label style={lbl}>Edition (e.g. Limited Edition)</label><input value={p.edition||''} onChange={e=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,edition:e.target.value}:x))} placeholder="Limited Edition" style={field}/></div>
                      <div><label style={lbl}>Paper (e.g. Hahnemühle Photo Rag®)</label><input value={p.paper||''} onChange={e=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,paper:e.target.value}:x))} placeholder="Hahnemühle Photo Rag®" style={field}/></div>
                    </div>
                    <div><label style={lbl}>Pixieset checkout link</label><input value={p.externalUrl||''} onChange={e=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,externalUrl:e.target.value}:x))} placeholder="https://nicmillerphotography.pixieset.com/..." style={{ ...field, fontSize:12.5 }}/></div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <Flag icon="★" label="Featured on homepage" on={p.featured} onClick={()=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,featured:!x.featured}:x))}/>
                      <Flag icon="●" label="Live on site" on={p.published} onClick={()=>setPrints(prev=>prev.map(x=>x.id===p.id?{...x,published:!x.published}:x))}/>
                      <button onClick={()=>{ if(confirm('Remove this listing?')) setPrints(prev=>prev.filter(x=>x.id!==p.id)) }} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(224,90,90,0.65)', fontSize:12.5, cursor:'pointer', fontFamily:'var(--font-manrope)' }}>Remove listing</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {prints.length>0 && (
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <button onClick={savePrints} style={primaryBtn} disabled={loading}>{loading?'Saving…':'Save all listings'}</button>
                <span style={{ fontSize:12, color:MT }}>Changes aren&#39;t live until you save.</span>
              </div>
            )}
          </div>
        )}

        {tab==='settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:18, maxWidth:620 }}>
            <div style={{ ...card, padding:28, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ fontFamily:'var(--font-jost)', fontSize:20, marginBottom:2 }}>Contact & Social</div>
              <div><label style={lbl}>Contact email</label><input value={stEmail} onChange={e=>setStEmail(e.target.value)} style={field}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Instagram username</label><input value={stIg} onChange={e=>setStIg(e.target.value)} style={field}/></div>
                <div><label style={lbl}>Facebook username</label><input value={stFb} onChange={e=>setStFb(e.target.value)} style={field}/></div>
              </div>
            </div>
            <div style={{ ...card, padding:28, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ fontFamily:'var(--font-jost)', fontSize:20, marginBottom:2 }}>Footer & Store</div>
              <div><label style={lbl}>Footer copyright</label><input value={stCopy} onChange={e=>setStCopy(e.target.value)} style={field}/></div>
              <div><label style={lbl}>Print store URL</label><input value={stStore} onChange={e=>setStStore(e.target.value)} style={field}/></div>
            </div>
            <div style={{ ...card, padding:20 }}>
              <div style={{ fontSize:13, color:MT, lineHeight:1.65, display:'flex', alignItems:'flex-start', gap:9 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.6" style={{ flexShrink:0, marginTop:1 }}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                To change your admin PIN: Vercel → nicmillerphotography → Settings → Environment Variables → ADMIN_PIN → update → Redeploy.
              </div>
            </div>
            <button onClick={saveSettings} disabled={loading} style={{ ...primaryBtn, alignSelf:'flex-start' }}>{loading?'Saving…':'Save Settings'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
