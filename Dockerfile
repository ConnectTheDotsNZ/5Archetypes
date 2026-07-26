# Five Archetypes platform — container image.
#
# Built for a container host (Fly.io, Render, Railway, ECS, or a plain VPS)
# behind a subdomain. A container is the right shape for this app because PDF
# export needs a real Chromium on disk: Vercel's serverless runtime has none,
# and would need puppeteer-core plus a Chromium layer instead (see
# src/lib/pdf/renderer.ts).

# ---- deps -------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# `npm ci` runs prisma generate via the postinstall of @prisma/client.
RUN npm ci

# ---- build ------------------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Chromium for PDF export, plus the font packages a report needs to render
# text (a bare image produces boxes instead of glyphs) and the CA certs Neon's
# TLS connection needs.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       chromium \
       ca-certificates \
       fonts-liberation \
       fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV PDF_RENDERER=chromium

# Next's standalone output plus the static assets it doesn't copy itself.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Prisma CLI + schema so migrations can be applied on deploy
# (`npx prisma migrate deploy`) from inside the running container.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Chromium won't start as root without --no-sandbox; the renderer passes that
# flag, but dropping privileges is still the safer default.
RUN useradd --system --create-home --uid 1001 appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
