# syntax=docker/dockerfile:1
#
# Production build for a self-hosted (server) Webiny project. Multi-stage: build the self-contained
# artifacts once, then ship a slim API runtime and a static Admin bundle. Build a single stage with
# `--target api` or `--target admin`. Copy this file to your project root.

# --- builder: produce the self-contained build/ folders -----------------------------------------
FROM node:24-bookworm AS builder
WORKDIR /project
ENV WEBINY_HOSTING_TYPE=server NODE_ENV=production
COPY . .
RUN corepack enable && yarn install --immutable

# The Admin bundle bakes its API origin at build time — override for a real host:
#   docker build --target admin --build-arg WEBINY_API_URL=https://api.example.com ...
ARG WEBINY_API_URL=http://localhost:3002
ENV WEBINY_API_URL=$WEBINY_API_URL

RUN yarn webiny build api && yarn webiny build admin

# --- api: run the self-contained handler (node start.mjs) ---------------------------------------
FROM node:24-bookworm-slim AS api
WORKDIR /app
COPY --from=builder /project/.webiny/workspace/apps/api/graphql/build ./
# Database, storage and secrets are supplied at RUN time (never baked): WEBINY_SQL_FILENAME (SQLite)
# or WEBINY_PG_* (Postgres), plus WEBINY_UPLOAD_SECRET, WEBINY_SELF_HOSTED_AUTH_SECRET, and
# WEBINY_PROJECT_ID / WEBINY_PROJECT_API_KEY (WCP license).
ENV PORT=3002
EXPOSE 3002
CMD ["node", "start.mjs"]

# --- admin: static bundle served by nginx (with SPA fallback) -----------------------------------
FROM nginx:alpine AS admin
COPY --from=builder /project/.webiny/workspace/apps/admin/build /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
