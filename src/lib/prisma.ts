import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Neon's serverless driver needs a WebSocket implementation on plain Node.js,
// which has no global WebSocket to fall back on. Next.js Middleware (where
// auth0.ts's onCallback also touches Prisma) runs on the Edge runtime, which
// *does* provide a native WebSocket — forcing the Node-only `ws` package
// there breaks with "ws does not work in the browser", since `ws` needs
// Node's net/tls modules that don't exist in that runtime. See
// https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

function makePrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Standard Next.js dev-mode singleton pattern to avoid exhausting DB
// connections on hot reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
