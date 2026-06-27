import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Neon provides NEON_POSTGRES_PRISMA_URL which is the correct Prisma-compatible URL
const url = process.env.NEON_POSTGRES_PRISMA_URL
  ?? process.env.NEON_DATABASE_URL
  ?? process.env.DATABASE_URL

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url } },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
