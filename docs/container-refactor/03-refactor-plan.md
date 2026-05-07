# 03 — Refactor Plan

This is the execution plan: how the architecture in `01-architecture.md` gets built, in what order, on which branches, and with which exit criteria per stage.

## Branch convention

- **Umbrella PR:** `sven/poc/container` → targets `next`
- **Stage PRs:** `sven/poc/container-<slug>` → target `sven/poc/container`

Note: git refs cannot have a name be both a leaf and a directory in the same namespace, so `sven/poc/container/<slug>` would conflict with the umbrella `sven/poc/container`. The hyphenated stage convention avoids this.

## Strategy: vertical slice over breadth-first

Naive plan would be: build all `*-sqlite` storage-ops packages first, then wire them up at the end. That's faster to *specify* but everything is theoretical until integration — schema decisions in one package may need to ripple across all others, and there's no demo until the very end.

**Vertical slice instead.** Each stage from #5 onward produces a container that does **measurably more** than the previous stage:

- After stage 5: container boots, login works.
- After stage 6: can read/write content.
- After stage 7: can upload files, Admin UI loads.
- After stage 8: leaky abstractions cleaned up.
- After stage 9: full plugin set works.
- After stage 10: long-running services (tasks, scheduler, WS, email) wired up.

Reviewer cognitive load drops because each stage is end-to-end testable. Schema decisions get validated immediately. The user sees a working demo every couple of weeks.

## Each stage's PR description includes

- What changed (list of files / packages added / modified).
- What is now demonstrably working (`yarn ... && curl ...` or screenshot).
- Test results — which suites pass; what's intentionally not yet covered.
- Cross-links into `docs/container-refactor/`.

---

## Stage 1 — `sven/poc/container-docs`

**Goal.** This `docs/container-refactor/` folder. Architecture locked in writing before any code refactor.

**Scope.**
- `README.md`, `01-architecture.md`, `02-decisions.md`, `03-refactor-plan.md`, `04-test-strategy.md`, `05-risks-and-mitigations.md`, `06-out-of-scope.md`. (`07-developer-guide.md` is deferred to stage 11.)
- No code changes.

**Exit criteria.** All six docs merged. User has signed off on `02-decisions.md` and this file.

---

## Stage 2 — `sven/poc/container-runtime`

**Goal.** New `@webiny/handler-node` package — the long-lived twin of `@webiny/handler-aws`.

**Scope.**
- New package mirrors `handler-aws` structure but uses `app.listen({ port, host })` instead of `@fastify/aws-lambda`.
- `SIGTERM` / `SIGINT` graceful shutdown — drain in-flight requests, close handles.
- `/health` endpoint.
- Logging via plain `pino` (stdout JSON), not `pino-lambda`.
- Move `ITimer` from `@webiny/handler-aws/utils` to a neutral home (likely `@webiny/tasks`); add a container impl that returns `Infinity` from `getRemainingMilliseconds()`.
- A tiny test extension that boots a hello-world server.

**Exit criteria.**
- `node dist/server.js` boots, `/health` returns 200.
- Shuts down cleanly on `SIGTERM` (no orphaned in-flight requests).
- Existing `handler-aws` tests still green.
- `tasks` package no longer imports from `handler-aws`.

---

## Stage 3 — `sven/poc/container-build`

**Goal.** Container build pipeline.

**Scope.**
- Add `createBuildServer` in `@webiny/build-tools`, alongside `createBuildFunction`. Bundles to `dist/server.js`.
- Multi-stage `Dockerfile` (likely at `extensions/api/Dockerfile`): builder stage (`yarn install && yarn build`) → runtime stage (`node:lts-alpine`).
- Skeleton `docker-compose.yml` with just the `api` service.

**Exit criteria.**
- `docker compose up api` builds the image, runs the hello-world server from stage 2, container exits cleanly on `docker compose down`.
- Image size and build time captured in the PR description (baseline for future regressions).

---

## Stage 4 — `sven/poc/container-db-core`

**Goal.** SQLite database core, no consumers yet.

**Scope.**
- New `@webiny/db-sqlite` package.
- Drizzle ORM setup. Prefer `node:sqlite` (Node 22+) over `better-sqlite3`; document the choice in the PR.
- Single-table schema: `pk`, `sk`, `gsi1_pk`, `gsi1_sk`, `gsi_tenant_pk`, `gsi_tenant_sk`, `data` (JSON), `version`, `expires_at`. Indexes on each GSI column pair.
- Drizzle Kit migration runner. First migration creates the table and FTS5 shadow.
- Storage-ops query helpers: `begins_with → LIKE`, `between → BETWEEN`, cursor encoding.
- Unit tests for the helpers.
- **Spike:** pagination cursor parity — DDB `LastEvaluatedKey` (compound JSON) → SQLite `(pk, sk)` tuple cursor. Tiny test asserts equivalent paging behavior on a 100-item dataset.

**Exit criteria.**
- Unit tests cover query helpers and cursor parity.
- No storage-ops package consumes it yet — this is foundation only.
- Migration runs cleanly on a fresh SQLite file.

---

## Stage 5 — `sven/poc/container-slice-alpha` (TENANCY + SECURITY + LOGIN)

**Goal.** First runnable vertical slice. Container boots, authenticates against Keycloak, sets multi-tenant context per request.

**Scope.**
- New `@webiny/api-core-sqlite` mirroring `api-core-ddb` (tenancy, security, key-value, admin users).
- Wire Keycloak into `docker-compose.yml` with a seeded realm export and a dev user.
- Container-mode equivalent of `apps/api/graphql/src/index.ts` lives under `extensions/` (or a new entry file in the Webiny project template).
- Storage-ops contract tests reused from `api-core` test presets, run with the new `sqlite` variant.
- Defer leaky-factory deprecation work to stage 8 *unless* it actively blocks this slice.

**Exit criteria.**
- `docker compose up` boots Webiny container + Keycloak + Mailpit.
- Hitting GraphQL `/cms-manage` with a Keycloak-issued JWT resolves `currentTenant`.
- `yarn test:sqlite api-core` passes.
- Existing `yarn test:ddb api-core` passes (no regression).

---

## Stage 6 — `sven/poc/container-slice-beta` (MINIMAL CMS)

**Goal.** Second slice. CMS reads work end-to-end with one model and one entry.

**Scope.**
- New `@webiny/api-headless-cms-sqlite` storage operations.
- FTS5 shadow table for entry search; integrate with `searchableFields`.
- Storage-ops tests reused from `api-headless-cms` presets.
- Reuse the cursor parity work from stage 4 to make pagination behave the same as DDB.

**Exit criteria.**
- Create a content model + entry via GraphQL against the container; list / read / search work.
- CMS storage-ops contract tests green on SQLite.
- No regression in `yarn test:ddb api-headless-cms` or `yarn test:ddb-os api-headless-cms`.

---

## Stage 7 — `sven/poc/container-slice-gamma` (FILES + ADMIN UI)

**Goal.** Third slice. File upload/render works, Admin UI loads from the container.

**Scope.**
- New `@webiny/api-file-manager-fs` package implementing the existing `FileStorageDriver`. Bytes go to a mounted volume.
- New `@webiny/api-file-manager-sqlite` for file metadata (no `*-ddb` package exists today; this fills the gap).
- Sharp transforms read from the local FS instead of S3.
- Fastify static plugin serves the Admin UI build output from inside the API container.
- Dev-time signed-URL helper for the FS driver (replaces S3 presigned URLs).

**Exit criteria.**
- Upload a file via Admin UI; it persists on the volume.
- Thumbnail renders.
- Existing `FileStorageDriver` contract tests pass against the FS driver.

---

## Stage 8 — `sven/poc/container-abstractions`

**Goal.** Refactor leaky packages so SQLite consumers don't need fake `DynamoDBDocument`s.

**Scope.**
- For each of `api-aco`, `api-audit-logs`, `api-websockets`, `api-scheduler` (and any others surfaced during stages 5–7):
  - Add a new factory variant that takes pre-built storage operations.
  - Deprecate the old factory; old factory keeps working by routing through the new one.
- Migration notes added to `02-decisions.md` (Section ADR-9 references this stage).

**Exit criteria.**
- New factories proven by container-mode consumers in stage 9.
- Existing serverless tests still green and untouched.
- No public-API removal — only addition + deprecation marker.

---

## Stage 9 — `sven/poc/container-breadth`

**Goal.** Fill remaining storage-ops backends so the entire plugin set in `apps/api/graphql/src/index.ts` has SQLite equivalents.

**Scope.**
- `api-aco-sqlite`, `api-audit-logs-sqlite`, `api-record-locking-sqlite`, `api-mailer-sqlite`, `api-headless-cms-tasks-sqlite`, `api-website-builder-sqlite` (and friends), `api-workflows-sqlite`, etc.
- May land as 2–3 sub-PRs into the umbrella by package cluster, not 11 independent ones — they share schema patterns and reviewing one teaches you all of them.

**Exit criteria.**
- A complete container-mode entry file boots with no DDB factories anywhere.
- Per-package storage-ops contract tests green for `sqlite` variant.

---

## Stage 10 — `sven/poc/container-runtime-services`

**Goal.** Long-running runtime services that don't fit in the storage-ops layer.

**Scope.**
- `@webiny/api-background-tasks-sqlite` — in-process task runner backed by a SQLite queue table. No 15-min timeout, simpler resumption logic.
- `@webiny/api-scheduler-cron` — `node-cron` impl behind the existing scheduler abstraction.
- `@webiny/api-websockets` in-memory connection registry adapter + `@fastify/websocket` transport.
- Mailer points at Mailpit via SMTP transport (config-only — `api-mailer` already supports SMTP).
- `IdpAdmin` abstraction for admin-user CRUD; container path uses Keycloak Admin API.

**Exit criteria.**
- Tasks run in-process; cron-scheduled jobs fire; WS connect/disconnect/message works; emails land in the Mailpit UI.
- Admin user can be created via the API in container mode.

---

## Stage 11 — `sven/poc/container-dx`

**Goal.** Polish DX so a new contributor goes from `git clone` to logged-in Admin UI in under 5 minutes.

**Scope.**
- Final `docker-compose.yml` with seeded volumes, healthchecks, and named ports.
- Seed scripts (root tenant, admin user via Keycloak Admin API).
- `docs/container-refactor/07-developer-guide.md` — getting-started.
- Sample container-mode `webiny.config.tsx`.

**Exit criteria.**
- `git clone && docker compose up && open http://localhost:8080` works on a clean machine.
- Time-to-login measured and recorded in the PR description.

---

## Stage 12 — `sven/poc/container-e2e`

**Goal.** CI integration — both code paths green.

**Scope.**
- New CI job that boots `docker-compose` and runs a smoke E2E suite: login, create content model, create entry, upload file, search content, scheduled job fires.
- Existing serverless test suites stay in CI, untouched.

**Exit criteria.**
- Green CI on both serverless and container paths.
- Smoke suite catches a deliberately-introduced regression in a manual test (sanity check that the suite is real).

---

## Final merge

Once stages 1–12 are merged into `sven/poc/container`, open the umbrella PR `sven/poc/container → next`. Reviewers see a single combined diff but per-stage history is preserved. Squash merge optional — the per-stage PRs into the umbrella are likely the more useful unit for `git log`.
