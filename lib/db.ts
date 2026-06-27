/**
 * lib/db.ts
 *
 * Prisma client singleton. Next.js hot-reload creates a new module instance
 * on every file change in dev, which would exhaust the DB connection pool.
 * The global trick prevents that.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
