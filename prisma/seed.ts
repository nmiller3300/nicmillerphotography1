/**
 * prisma/seed.ts
 * Run with: npm run db:seed
 *
 * Seeds the database with the default content that was previously
 * hard-coded in the prototype's HTML files.
 *
 * NOTE: This seed does NOT import photos — those live in Blob storage.
 * The placeholder photos array from the prototype should be re-uploaded
 * through the admin panel after seeding.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Nic Miller Photography database...')

  // ── Settings ──────────────────────────────────────────────────────────────
  await db.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      email: 'nmiller3300@gmail.com',
      instagram: 'nicmiller.photography',
      facebook: 'nicmiller.photography',
      copyright: '© 2026 Nic Miller Photography. All rights reserved.',
      storeUrl: 'https://nicmillerphotography.pixieset.com',
      imageQuality: 82,
      sessionMinutes: 120,
    },
    update: {},
  })
  console.log('  ✓ Settings')

  // ── SEO ───────────────────────────────────────────────────────────────────
  await db.seoSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      title: 'Nic Miller Photography — Fine Art Nature & Landscape Prints',
      description:
        'Limited-edition nature, wildlife and landscape prints by Nic Miller. Museum-quality archival paper, shipped worldwide.',
      slug: '/',
      canonical: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nicmiller.photography',
      indexable: true,
    },
    update: {},
  })
  console.log('  ✓ SEO defaults')

  // ── Site Content ──────────────────────────────────────────────────────────
  const contentSeeds: Array<{ key: string; value: unknown }> = [
    { key: 'heroEyebrow', value: 'BEYOND THE FRAME.' },
    { key: 'heroTitle', value: 'A Different Way of Seeing Beauty.' },
    {
      key: 'heroSubtitle',
      value:
        'Wildlife, landscapes, and natural moments\nphotographed with atmosphere and intention.',
    },
    {
      key: 'aboutBio',
      value:
        "I'm Nic — a nature, wildlife and landscape photographer. I chase quiet light, honor wild places, and make images with atmosphere and intention, built to live on a wall and keep giving.",
    },
    { key: 'storyTitle', value: 'Beyond the Frame' },
    {
      key: 'story',
      value: [
        "I didn't start with a camera so much as a restlessness — a need to be out before dawn, where the light is still deciding what kind of day it wants to be.",
        "Wildlife taught me patience; landscapes taught me humility. Most of my favorite frames came after hours of waiting, when I'd almost convinced myself nothing would happen. Then it did.",
        "I don't manufacture drama in post. What you see is what was there — atmosphere, weather, and a little luck, held steady long enough to keep.",
      ],
    },
  ]

  for (const item of contentSeeds) {
    await db.siteContent.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value as never },
      update: {},
    })
  }
  console.log('  ✓ Site content (hero, about, story)')

  // ── Categories ────────────────────────────────────────────────────────────
  const categorySeeds = [
    { name: 'Wildlife', slug: 'wildlife', order: 1 },
    { name: 'Landscapes', slug: 'landscapes', order: 2 },
    { name: 'Nature', slug: 'nature', order: 3 },
    { name: 'Birds', slug: 'birds', order: 4 },
    { name: 'Aquatic Life', slug: 'aquatic-life', order: 5 },
  ]

  for (const cat of categorySeeds) {
    await db.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {},
    })
  }
  console.log('  ✓ Categories')

  // ── Prints (placeholder — attach to real media after upload) ──────────────
  // These use placeholder data; update mediaId after uploading the actual photos.
  const printSeeds = [
    {
      title: 'Echoes of Dawn',
      location: 'Lofoten, Norway',
      fromPrice: 295,
      edition: 'Ed. 1/25',
      paper: 'Hahnemühle Photo Rag®',
      sizes: [
        { label: '16×24"', price: 295 },
        { label: '24×36"', price: 395 },
        { label: '30×45"', price: 495 },
      ],
      featured: true,
      published: true,
    },
    {
      title: 'Coastal Ember',
      location: 'Big Sur, USA',
      fromPrice: 265,
      edition: 'Open Edition',
      paper: 'Canson Platine',
      sizes: [
        { label: '16×24"', price: 265 },
        { label: '24×36"', price: 365 },
      ],
      featured: false,
      published: true,
    },
    {
      title: 'Starfield Pass',
      location: 'Atacama, Chile',
      fromPrice: 285,
      edition: 'Ed. 1/30',
      paper: 'Hahnemühle Photo Rag®',
      sizes: [
        { label: '16×24"', price: 285 },
        { label: '24×36"', price: 385 },
        { label: '30×45"', price: 485 },
      ],
      featured: false,
      published: true,
    },
    {
      title: 'Silent Cathedral',
      location: 'Olympic NP, USA',
      fromPrice: 245,
      edition: 'Open Edition',
      paper: 'Canson Platine',
      sizes: [
        { label: '16×24"', price: 245 },
        { label: '24×36"', price: 345 },
      ],
      featured: false,
      published: false,
    },
  ]

  // Only seed prints if the table is empty (avoid duplicate runs)
  const existingPrints = await db.print.count()
  if (existingPrints === 0) {
    await db.print.createMany({ data: printSeeds })
    console.log('  ✓ Print listings (4 — attach mediaId after photo upload)')
  } else {
    console.log('  – Print listings already seeded, skipping')
  }

  // ── Sample Messages ───────────────────────────────────────────────────────
  const existingMsgs = await db.message.count()
  if (existingMsgs === 0) {
    await db.message.createMany({
      data: [
        {
          name: 'Amelia Roe',
          email: 'amelia.roe@studio-north.com',
          body: "Hi Nic — we're refurbishing our office lobby and would love a large statement print of Peaks of Tranquility, around 40×60\". Do you offer framing, and what's the lead time? Thank you!",
          status: 'New',
        },
        {
          name: 'James Tan',
          email: 'james.tan@gmail.com',
          body: 'Hello! I love the Lofoten work. Do you ship framed prints internationally to Singapore, and is there a customs surcharge I should expect?',
          status: 'New',
        },
        {
          name: 'Maria Köhler',
          email: 'maria@kohlerhaus.de',
          body: "Your Lofoten series is stunning. We have a chalet in the Alps and would love to commission a sunrise piece. Are commissions something you take on?",
          status: 'New',
        },
        {
          name: 'Daniel Vega',
          email: 'dvega@outlook.com',
          body: "Hi Nic, just following up on the Atacama night sky print — did you have the 24×36 back in stock? Happy to pay a deposit.",
          status: 'Replied',
        },
      ],
    })
    console.log('  ✓ Sample messages')
  } else {
    console.log('  – Messages already present, skipping')
  }

  console.log('\n✅ Seed complete.')
  console.log('   Next: upload photos through the admin panel, then attach mediaId to prints.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
