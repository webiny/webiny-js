# Webiny container API — Stage 3 of the container refactor POC.
#
# This Dockerfile assumes the bundled server has already been produced via
# `createBuildServer` (e.g., `yarn build:server`). The image is intentionally
# minimal — a Node runtime plus the bundled entry. A self-contained build
# (yarn install + bundle inside the image) is a follow-on optimization.

FROM node:22-alpine

WORKDIR /app

# Copy the pre-built server bundle (and any code-split chunks rsbuild emitted).
COPY build/ ./build/

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

# Container orchestrators (docker-compose, Kubernetes) probe /health via
# the HEALTHCHECK directive. wget ships with the Alpine base image.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["node", "build/server.mjs"]
