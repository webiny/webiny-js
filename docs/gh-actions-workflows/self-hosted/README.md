# Self-hosted (server) GitHub Actions workflows

Example CI/CD for the **self-hosted (server) hosting type** — the counterpart to the AWS workflows in
the parent folder. Instead of `webiny deploy` (which provisions AWS via Pulumi), these **build Docker
images and push them to a registry**; your container platform then pulls and runs them.

## What's here

| File | Copy to | Purpose |
|------|---------|---------|
| `Dockerfile` | project root | Multi-stage build → `api` (Node, `node start.mjs`) and `admin` (nginx, static) images |
| `nginx-spa.conf` | project root | nginx config for the Admin image — SPA fallback so deep-links/refresh don't 404 |
| `pushDev.yml` / `pushStaging.yml` / `pushProd.yml` | `.github/workflows/` | On push to `dev` / `staging` / `prod`: build + push `api` and `admin` images tagged per environment |
| `pullRequest.yml` | `.github/workflows/` | On PRs: static analysis + a build-only smoke check (self-hosted PRs create no infrastructure, so there is no per-PR environment to deploy or destroy — hence no "pull request closed" workflow) |

## The model

```
git push  →  GitHub Actions  →  docker build (runs `webiny build` inside)  →  push image to GHCR  →  platform pulls + runs
```

The image is the whole deploy artifact — the server never runs `yarn install` or `webiny build`.

## Registry

These examples push to the **GitHub Container Registry** (`ghcr.io`) using the automatic
`GITHUB_TOKEN` (note `permissions: packages: write`) — no extra secret needed. Images land at
`ghcr.io/<owner>/<repo>/api:<env>` and `.../admin:<env>`. To pull them from your host, either make the
package public or give the host a token with `read:packages`. Swap in Docker Hub / ECR / etc. by
changing the `registry` + `tags`.

## Configuration

**GitHub secret (per environment):**

- `PROD_WEBINY_API_URL` (and `STAGING_` / `DEV_`) — the Admin bundle bakes this at **build time** so the
  browser knows where the API is. Set it to the public API URL for that environment.

**Runtime env — set on your container platform, not in CI** (the same image runs everywhere; only these
change per deployment):

- Database — SQLite: `WEBINY_SQL_FILENAME` (on a persistent volume), **or** Postgres: `WEBINY_PG_HOST`,
  `WEBINY_PG_PORT`, `WEBINY_PG_USER`, `WEBINY_PG_PASSWORD`, `WEBINY_PG_DATABASE`.
- `WEBINY_UPLOAD_SECRET`, `WEBINY_SELF_HOSTED_AUTH_SECRET` — change from the dev defaults.
- `WEBINY_PROJECT_ID`, `WEBINY_PROJECT_API_KEY` — WCP license.

## Deploying (the last step)

Each push workflow ends with a commented, platform-specific "tell the platform to pull the new image"
step — ECS/Fargate, Cloud Run, Fly.io, Kubernetes. Uncomment and adapt the one for your platform, or
let a platform that watches the registry (Render, Railway, …) pull automatically.

## Notes from real deploys

- **Memory**: the API is not tiny — give the container **≥ 512 MB (1 GB is comfortable)**. Under ~256 MB
  it swaps and requests crawl.
- **SQLite vs Postgres**: SQLite on a **persistent volume** is the simplest single-node setup (data +
  uploads survive restarts, but a volume pins you to one machine). For multiple instances / HA, use
  **Postgres** (shared) — no volume needed for the database.
- **Admin is static + cross-origin**: it's served by nginx and calls the API on another origin, so the
  API must allow the Admin's origin (CORS). The SPA fallback in `nginx-spa.conf` is what stops a hard
  refresh on a client-side route from 404-ing.
