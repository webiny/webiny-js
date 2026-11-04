# Standalone GitHub Actions workflows

Example CI/CD for the **standalone hosting type** — the counterpart to the AWS workflows in
the parent folder. Instead of `webiny deploy` (which provisions AWS via Pulumi), these **build Docker
images and push them to a registry**; your container platform then pulls and runs them.

## What's here

| File | Copy to | Purpose |
|------|---------|---------|
| `Dockerfile` | project root | Multi-stage build → `api` (Node, `node start.mjs`) and `admin` (nginx, static) images |
| `nginx-spa.conf` | project root | nginx config for the Admin image — SPA fallback so deep-links/refresh don't 404 |
| `pushDev.yml` / `pushStaging.yml` / `pushProd.yml` | `.github/workflows/` | On push to `dev` / `staging` / `prod`: build + push `api` and `admin` images tagged per environment |
| `pullRequest.yml` | `.github/workflows/` | On PRs: static analysis + a build-only smoke check (standalone PRs create no infrastructure, so there is no per-PR environment to deploy or destroy — hence no "pull request closed" workflow) |

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
  browser knows where the API is. Set it to the public API URL for that environment. Only the Admin
  image uses it.

**Runtime env — set on your container platform, not in CI.** The API reads these when it starts, so
the API image built and tested in one environment runs unchanged in the others:

- `WEBINY_API_URL` (required) — the public API URL. Used for file URLs and upload URLs.
- `WEBINY_ADMIN_URL` (optional) — the public Admin URL, handed to websites by the starter-kit configs.
- `WEBINY_LOCAL_STORAGE_PATH` (required) — where uploaded files live, on a persistent volume.
- `WEBINY_UPLOAD_SECRET` (required) — signs upload tokens.
- `WEBINY_SELF_HOSTED_AUTH_SECRET` (required) — signs login tokens.
- `WEBINY_ENCRYPTION_PASSPHRASE` (required) and `WEBINY_ENCRYPTION_SALT` (optional) — the encryption
  key. A standalone API always encrypts.
- `WEBINY_HASHING_PEPPER` (required) — folded into every password and API-key hash.

Keep the passphrase, salt and pepper stable and backed up. Changing the passphrase or salt makes
encrypted data unreadable; changing the pepper stops every existing password from verifying.
- Database — SQLite: `WEBINY_SQL_FILENAME` (on a persistent volume), **or** Postgres: `WEBINY_PG_HOST`,
  `WEBINY_PG_PORT`, `WEBINY_PG_USER`, `WEBINY_PG_PASSWORD`, `WEBINY_PG_DATABASE`.
- `WEBINY_PROJECT_ID`, `WEBINY_PROJECT_API_KEY` — WCP license.
- `WEBINY_REDIS_URL` (optional, `redis://` or `rediss://`) — a Redis or Valkey server that carries
  websocket messages between API processes. Required when more than one API process runs: without
  it, a message reaches only the browsers connected to the process that sent it. One process needs
  nothing.

The API refuses to start, and names the variables, when a required one is missing or blank. No
secret is baked into the image: the values in `webiny.config.tsx` are only used by `webiny watch` and
`webiny serve`.

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
