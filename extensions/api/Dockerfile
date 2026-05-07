# Webiny container API.
#
# Assumes the bundled server has already been produced via `createBuildServer`
# (yarn build:server) AND the bundled Admin SPA via `createBuildAdmin` (yarn
# build:admin). The image installs only the externalized native deps
# (better-sqlite3 and friends) — everything else is bundled into server.mjs.
# A self-contained build (yarn install + bundle inside the image) is a
# follow-on optimization.
#
# Build context: must be `./extensions` (the parent of api/ and admin/) so
# the admin SPA bundle is reachable. docker-compose.yml sets this.

FROM node:22-bookworm-slim

WORKDIR /app

# Copy the pre-built server bundle.
COPY api/build/ ./build/

# Copy the pre-built Admin SPA. server.ts looks at ADMIN_BUILD_DIR
# (default /app/admin) and mounts @fastify/static if the directory
# exists, so omitting this layer is acceptable for API-only images.
COPY admin/build/ ./admin/

# Externalized native deps — must match the externals list in
# packages/build-tools/bundling/server/createRsbuildConfig.js. better-sqlite3
# ships prebuilt binaries for linux x86_64 / arm64, so this is a fast,
# toolchain-free install.
RUN npm install --omit=dev --no-save \
        better-sqlite3@^11.5.0 \
    && rm -rf /root/.npm

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV ADMIN_BUILD_DIR=/app/admin

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8080/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "build/server.mjs"]
