# Container Refactor

This folder collects the design and execution plan for adding a **container deployment path** to Webiny.

Webiny today runs exclusively on AWS serverless (Lambda + DynamoDB + S3 + OpenSearch + Cognito + EventBridge). The goal of this refactor is to make Webiny *also* runnable inside a single Docker container — alongside `keycloak` and `mailpit` services in `docker-compose` — without changing anything about the existing serverless code path. Existing customers see no behavioral changes; the container path is opt-in via the user's `webiny.config.tsx` and `extensions/`.

This folder is the durable record of why we chose what we chose, and how the refactor will be sequenced. Read these in order if you're new to the work.

## Reading order

| # | File | What's in it |
|---|---|---|
| 1 | [`01-architecture.md`](./01-architecture.md) | Target architecture: serverless and container side by side. New packages, abstraction boundaries, where the runtime split happens. |
| 2 | [`02-decisions.md`](./02-decisions.md) | ADR-style record of the 10 decisions that shaped the design (database, topology, search backend, file storage, auth, staging, etc.). |
| 3 | [`03-refactor-plan.md`](./03-refactor-plan.md) | Stage-by-stage refactor plan. Branch naming, scope per stage, exit criteria. Vertical-slice strategy: each stage from #5 onward produces a runnable demo. |
| 4 | [`04-test-strategy.md`](./04-test-strategy.md) | Vitest preset reuse, the new `sqlite` test variant, expected behavioral divergences between DDB and SQLite, end-to-end smoke approach. |
| 5 | [`05-risks-and-mitigations.md`](./05-risks-and-mitigations.md) | Risks identified during planning (hidden coupling, breaking-change surfaces, perf concerns, etc.) and how each is mitigated. |
| 6 | [`06-out-of-scope.md`](./06-out-of-scope.md) | What is intentionally deferred to a future phase and why (api-sync-system, AWS IoT watch mode, CloudFront/S3 admin UI hosting, SES). |
| 7 | [`07-developer-guide.md`](./07-developer-guide.md) | Getting-started guide for running Webiny locally with `docker compose up`. Prerequisites, smoke checks, where things live, troubleshooting, and the honest list of current limitations. |
| 8 | [`08-concurrency-isolation.md`](./08-concurrency-isolation.md) | The architectural model for handling Webiny's Lambda-shaped "one process per request" assumptions inside a long-lived container. Per-request AsyncLocalStorage scoping, DI registration dedupe, stateful-singleton scoping, per-endpoint plugin pinning, and the stress test that gates regressions. |
| 9 | [`09-storage-ops-status.md`](./09-storage-ops-status.md) | Living checklist of remaining work in the SQLite storage-operations packages (entry/model/group, ACO, audit-logs, file-manager). Updated as items land. |

## Status

The container POC is functional through stage 12 (CI integration). Stages 1–11 shipped the architecture, all the SQLite-backed storage operations packages, the local-FS file driver, the in-memory websockets adapter, the in-process scheduler, the container-mode Admin SPA hosted from the same API container, full Keycloak-backed JWT auth, and the per-request concurrency isolation described in `08-concurrency-isolation.md`. Stage 12 wires `yarn container:stress` (1000 concurrent mixed requests) into CI as the durability gate. The container API boots without a single AWS SDK call on the request path. Read `07-developer-guide.md` for the practical "how do I run this" walkthrough and the canonical list of current limitations / follow-on work.

## Branches

- **Umbrella PR:** `sven/poc/container` (targets `next`)
- **Stage PRs:** `sven/poc/container-<slug>` (target `sven/poc/container`)

Note on naming: git refs cannot have a name be both a leaf and a directory in the same namespace, so `sven/poc/container/<slug>` would conflict with the umbrella `sven/poc/container`. The hyphenated stage convention avoids this while keeping the intent clear.

This folder lives on branch `sven/poc/container-docs`.
