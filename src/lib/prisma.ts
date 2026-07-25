import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton pattern to avoid exhausting DB
// connections on hot reload. Not yet wired into any page in this scaffold —
// see docs/CLAUDE_CODE_KICKOFF.md step 1.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
