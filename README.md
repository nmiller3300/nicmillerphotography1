# Nic Miller Photography — Backend

Next.js 15 (App Router) + Supabase Postgres + Vercel Blob + Vercel KV + iron-session.

---

## Database

**Project:** nic-miller-photography  
**Supabase Project ID:** `zaokceyturwcfowlvyna`  
**Region:** us-east-1  
**Status:** Live — schema and seed data already applied.

### Get your database password
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → nic-miller-photography
2. Settings → Database → **Database password** (copy it)
3. Paste into both URLs in `.env.local`:

```
DATABASE_URL="postgresql://postgres.zaokceyturwcfowlvyna:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.zaokceyturwcfowlvyna.supabase.co:5432/postgres"
```

`DATABASE_URL` = transaction pooler (serverless-safe, used at runtime)  
`DIRECT_URL` = direct connection (used by Prisma Migrate only — keep it out of Vercel runtime env)

---

## Quickstart

```bash
# 1. Install
npm install

# 2. Create .env.local from the example and fill in your DB password + secrets
cp .env.example .env.local

# 3. Generate the Prisma client (schema already matches the live DB)
npx prisma generate

# 4. Dev server
npm run dev
```

The database is already seeded — you don't need to run migrations or seed again.

---

## Vercel Deployment

### 1. Connect storage

In the Vercel project dashboard → **Storage**:

| Service | Purpose |
|---|---|
| **Blob** | Image storage (private masters + public CDN derivatives) |
| **KV Database** | Rate limiting for the admin login route |

Connect both. Vercel auto-injects their env vars.

### 2. Set environment variables

In Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `ADMIN_PIN` | Your 6-digit admin PIN |
| `SESSION_SECRET` | 32+ char random string (`openssl rand -hex 32`) |
| `DATABASE_URL` | Transaction pooler URL (with your DB password) |
| `NEXT_PUBLIC_SITE_URL` | `https://nicmiller.photography` |
| `RESEND_API_KEY` | Optional — for contact form email notifications |
| `NOTIFICATION_EMAIL` | Optional — where to send contact alerts |

> **Do NOT add `DIRECT_URL` to Vercel** — it's only needed locally for `prisma migrate dev`.

### 3. Deploy

```bash
vercel --prod
```

or push to your connected GitHub branch.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Database | Supabase Postgres (via Prisma) |
| Image storage | Vercel Blob — private masters + public derivatives |
| Image processing | `sharp` — AVIF + WebP + JPEG, sRGB, GPS stripped |
| Rate limiting | Vercel KV (Upstash Redis) |
| Auth | `iron-session` — HTTP-only cookie, constant-time PIN |
| Fonts | `next/font/google` — Jost + Manrope |

---

## Image Upload Pipeline

`POST /api/admin/upload` (multipart, `file` field):

1. sha256 checksum → duplicate rejected with 409
2. Private master → `masters/{checksum}` with `access: 'private'`. Never modified, never served.
3. Metadata → `sharp().metadata()` + ExifReader. GPS kept in DB only.
4. Derivatives → AVIF + WebP + JPEG at `[480, 960, 1440, 2048, 2560]`, no upscaling past original.
   - AVIF 55 / WebP 80 / JPEG 82 (configurable in Settings)
   - sRGB, GPS stripped, sRGB ICC profile embedded
5. Derivatives → `photos/{checksum}/{width}.{ext}` with `access: 'public'`, 1-year CDN cache
6. DB → `media` + `derivative` rows written. `masterKey` stored but never returned to browser.

---

## Non-destructive Crops

`POST /api/admin/media/:id/crop` saves `{ context, focalX, focalY, zoom, cropBox }` to `crops` table.  
Master file never touched. `DELETE ...?context=desktop_hero` resets to full-frame.

Contexts: `desktop_hero` · `mobile_hero` · `portfolio_card` · `collection_cover` · `recent_thumb` · `print_card` · `social`

---

## Frontend Port

### Public site (`Nic Miller Photography.dc.html`)

| Section | Route |
|---|---|
| Home | `app/page.tsx` |
| Portfolio | `app/portfolio/page.tsx` |
| Print Room | `app/prints/page.tsx` |
| About | `app/about/page.tsx` |
| Story | `app/story/page.tsx` |
| Contact | `app/contact/page.tsx` |

### Admin panel (`Admin Panel.dc.html`)

Convert to `'use client'` component. Replace every `localStorage.*` with the corresponding API call:

| Old (localStorage) | New (API) |
|---|---|
| `getItem('nm_heroEyebrow')` | `GET /api/admin/content` |
| `setItem('nm_heroEyebrow')` | `PATCH /api/admin/content` |
| `getItem('nm_uploads')` + FileReader | `POST /api/admin/upload` (FormData) |
| `getItem('nm_msgs')` | `GET /api/admin/messages` |
| `setItem('nm_msgs', ...)` | `PATCH /api/admin/messages/:id` |
| `getItem('nm_prints')` | `GET /api/admin/prints` |
| `setItem('nm_prints')` | `PATCH /api/admin/prints` |
| `getItem('nm_seo')` | `GET /api/admin/seo` |
| `setItem('nm_seo')` | `PATCH /api/admin/seo` |
| `getItem('nm_settings')` | `GET /api/admin/settings` |
| `setItem('nm_settings')` | `PATCH /api/admin/settings` |
| `getItem('nm_categories')` | `GET /api/admin/categories` |
| `setItem('nm_categories')` | `POST/PATCH/DELETE /api/admin/categories` |
| `getItem('nm_meta')` + id patching | `PATCH /api/admin/media/:id` |
| localStorage storage meter | Remove — not needed |
| `ADMIN_PIN = '004089'` check | Remove — `POST /api/admin/login` handles it |

### dc.html → JSX cheat sheet

| dc.html | JSX |
|---|---|
| `{{ variable }}` | `{variable}` |
| `<sc-if value="{{ x }}">` | `{x && <div>...</div>}` |
| `<sc-for list="{{ arr }}" as="p">` | `{arr.map((p, i) => <div key={i}>...</div>)}` |
| `onClick="{{ handler }}"` | `onClick={handler}` |

### Particle canvas

```tsx
// components/ParticleCanvas.tsx
'use client'
import { useEffect, useRef } from 'react'

export default function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    // Lift initParticles() verbatim from Nic Miller Photography.dc.html (~lines 428–445)
  }, [])
  return (
    <canvas
      ref={ref}
      style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:5 }}
    />
  )
}
```

---

## API Reference

```
POST   /api/admin/login              { pin } → sets session cookie
POST   /api/admin/logout
POST   /api/admin/upload             multipart file → media + derivatives
GET    /api/admin/media              ?status=&orientation=&category=&sort=&page=
GET    /api/admin/media/:id
PATCH  /api/admin/media/:id          title, status, featured, printEnabled, homepage, …
DELETE /api/admin/media/:id          ?hard=true for permanent delete
POST   /api/admin/media/:id/crop     { context, focalX, focalY, zoom, cropBox }
DELETE /api/admin/media/:id/crop     ?context=desktop_hero
GET    /api/admin/content            ?keys=heroEyebrow,heroTitle
PATCH  /api/admin/content            { heroEyebrow, heroTitle, … }
GET    /api/admin/categories
POST   /api/admin/categories         { name }
PATCH  /api/admin/categories         { id, name, order }
DELETE /api/admin/categories         ?id=
GET    /api/admin/messages           ?status=New&page=1
GET    /api/admin/messages/:id       (auto-marks New → Read)
PATCH  /api/admin/messages/:id       { status }
GET    /api/admin/prints
POST   /api/admin/prints             { title, location, … }
PATCH  /api/admin/prints             { id, … } or [{ id, … }, …]
DELETE /api/admin/prints             ?id=
GET    /api/admin/seo
PATCH  /api/admin/seo
GET    /api/admin/settings
PATCH  /api/admin/settings
POST   /api/contact                  { name, email, body } — public form
```
