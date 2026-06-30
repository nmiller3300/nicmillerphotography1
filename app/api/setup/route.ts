export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SETUP_KEY = 'setup-nicmiller-2026'

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('key') !== SETUP_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, "order" INTEGER NOT NULL DEFAULT 0)`)
    results.push('categories')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS media (id SERIAL PRIMARY KEY, title TEXT NOT NULL, caption TEXT, description TEXT, alt TEXT, capture_date TEXT, location TEXT, camera TEXT, category_id INTEGER REFERENCES categories(id), checksum TEXT NOT NULL UNIQUE, width INTEGER NOT NULL, height INTEGER NOT NULL, aspect DOUBLE PRECISION NOT NULL, orientation TEXT NOT NULL, file_size BIGINT NOT NULL, color_profile TEXT, exif JSONB, master_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', featured BOOLEAN NOT NULL DEFAULT FALSE, print_enabled BOOLEAN NOT NULL DEFAULT FALSE, homepage BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    results.push('media')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS derivatives (id SERIAL PRIMARY KEY, media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE, format TEXT NOT NULL, width INTEGER NOT NULL, url TEXT NOT NULL, bytes INTEGER NOT NULL, UNIQUE(media_id, format, width))`)
    results.push('derivatives')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS crops (id SERIAL PRIMARY KEY, media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE, context TEXT NOT NULL, focal_x DOUBLE PRECISION NOT NULL DEFAULT 50, focal_y DOUBLE PRECISION NOT NULL DEFAULT 50, crop_box JSONB, zoom DOUBLE PRECISION NOT NULL DEFAULT 100, UNIQUE(media_id, context))`)
    results.push('crops')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS collections (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, cover_media_id INTEGER REFERENCES media(id), published BOOLEAN NOT NULL DEFAULT FALSE, homepage BOOLEAN NOT NULL DEFAULT FALSE, "order" INTEGER NOT NULL DEFAULT 0)`)
    results.push('collections')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS collection_items (collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE, media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE, "order" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(collection_id, media_id))`)
    results.push('collection_items')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS prints (id SERIAL PRIMARY KEY, media_id INTEGER REFERENCES media(id), title TEXT NOT NULL, location TEXT, edition TEXT, paper TEXT, from_price DOUBLE PRECISION, sizes JSONB, featured BOOLEAN NOT NULL DEFAULT FALSE, published BOOLEAN NOT NULL DEFAULT FALSE, external_url TEXT, mockups JSONB)`)
    results.push('prints')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'New', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    results.push('messages')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value JSONB NOT NULL)`)
    results.push('site_content')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS seo_settings (id INTEGER PRIMARY KEY DEFAULT 1, title TEXT, description TEXT, slug TEXT, canonical TEXT, og_media_id INTEGER REFERENCES media(id), indexable BOOLEAN NOT NULL DEFAULT TRUE, CHECK (id = 1))`)
    results.push('seo_settings')
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY DEFAULT 1, email TEXT, instagram TEXT, facebook TEXT, copyright TEXT, store_url TEXT, image_quality INTEGER NOT NULL DEFAULT 82, session_minutes INTEGER NOT NULL DEFAULT 120, CHECK (id = 1))`)
    results.push('settings')

    // ── Idempotent migrations (safe to run repeatedly) ──
    await db.$executeRawUnsafe(`ALTER TABLE media ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`)
    await db.$executeRawUnsafe(`ALTER TABLE collections ADD COLUMN IF NOT EXISTS slug TEXT`)
    await db.$executeRawUnsafe(`ALTER TABLE collections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)
    // Backfill sort_order from created_at so existing photos have a stable initial order
    await db.$executeRawUnsafe(`UPDATE media SET sort_order = sub.rn FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM media WHERE sort_order = 0) sub WHERE media.id = sub.id AND media.sort_order = 0`)
    results.push('migrations')

    // Seed — no literal newlines in JSON strings
    await db.$executeRawUnsafe(`INSERT INTO settings (id,email,instagram,facebook,copyright,store_url,image_quality,session_minutes) VALUES (1,'nmiller3300@gmail.com','nicmiller.photography','nicmiller.photography','© 2026 Nic Miller Photography. All rights reserved.','https://nicmillerphotography.pixieset.com',82,120) ON CONFLICT (id) DO NOTHING`)
    await db.$executeRawUnsafe(`INSERT INTO seo_settings (id,title,description,slug,canonical,indexable) VALUES (1,'Nic Miller Photography — Fine Art Nature & Landscape Prints','Limited-edition nature, wildlife and landscape prints by Nic Miller.','/','https://nicmiller.photography',TRUE) ON CONFLICT (id) DO NOTHING`)
    await db.$executeRawUnsafe(`INSERT INTO site_content (key,value) VALUES ('heroEyebrow','"BEYOND THE FRAME."'),('heroTitle','"A Different Way of Seeing Beauty."'),('heroSubtitle','"Wildlife, landscapes, and natural moments photographed with atmosphere and intention."'),('aboutBio','"I''m Nic — a nature, wildlife and landscape photographer. I chase quiet light, honor wild places, and make images with atmosphere and intention, built to live on a wall and keep giving."'),('storyTitle','"Beyond the Frame"') ON CONFLICT (key) DO NOTHING`)
    await db.$executeRawUnsafe(`INSERT INTO categories (name,slug,"order") VALUES ('Wildlife','wildlife',1),('Landscapes','landscapes',2),('Nature','nature',3),('Birds','birds',4),('Aquatic Life','aquatic-life',5) ON CONFLICT (slug) DO NOTHING`)
    results.push('seed done')

    return NextResponse.json({ ok: true, steps: results })
  } catch (err) {
    return NextResponse.json({ error: String(err), completed: results }, { status: 500 })
  }
}
