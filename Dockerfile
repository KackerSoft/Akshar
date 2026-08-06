# syntax=docker/dockerfile:1.7

# bookworm-slim (glibc), not alpine — Playwright's Chromium build doesn't
# support musl.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --config.strict-dep-builds=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not
# read at container runtime — must be passed as --build-arg (or compose
# build.args), env_file alone won't reach them.
ARG NEXT_PUBLIC_MAALGAADI_ENDPOINT
ARG NEXT_PUBLIC_MAALGAADI_API_ENDPOINT
ENV NEXT_PUBLIC_MAALGAADI_ENDPOINT=$NEXT_PUBLIC_MAALGAADI_ENDPOINT
ENV NEXT_PUBLIC_MAALGAADI_API_ENDPOINT=$NEXT_PUBLIC_MAALGAADI_API_ENDPOINT
RUN pnpm exec prisma generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Fixed, known path so it can be chown'd to the non-root user below.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV HOME=/home/nextjs
# --system alone leaves $HOME unwritable, which breaks anything that caches
# to it (e.g. corepack); --create-home gives it a real, own(-able) home dir.
RUN groupadd --system nodejs && useradd --system --create-home --home-dir /home/nextjs --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/lib/generated ./lib/generated
COPY docker/entrypoint.sh /entrypoint.sh

# Downloads Chromium + installs its OS-level dependencies via apt — needs
# root, so this runs before switching to the nextjs user below.
RUN npx playwright-core install --with-deps chromium \
  && apt-get clean && rm -rf /var/lib/apt/lists/* \
  && chmod +x /entrypoint.sh \
  && chown -R nextjs:nodejs /app /ms-playwright /home/nextjs

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
# Invoke the binary directly rather than via `pnpm start`/corepack, which
# needs a writable $HOME to resolve the package manager at runtime.
CMD ["node_modules/.bin/next", "start"]
