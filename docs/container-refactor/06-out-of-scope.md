# 06 — Out of Scope

The user explicitly asked for a focused POC. This document records what we're *not* doing, and why each item was deferred. The same items are summarized in ADR-10 (`02-decisions.md`).

The point of an explicit out-of-scope list is to short-circuit "but what about…?" reviews and keep the umbrella PR shippable.

---

## OOS-1 — `api-sync-system` + DDB-streams-driven OpenSearch CDC (**permanently** out of scope)

**What it is.** A pipeline that propagates DynamoDB writes to OpenSearch by tailing DDB Streams and invoking a destination Lambda. The package family: `api-sync-system`, `api-dynamodb-to-elasticsearch`, `api-elasticsearch`, `api-elasticsearch-tasks`.

**Why permanently out of scope.** This is a DDB-streams-to-OpenSearch pipeline — both halves of the chain are AWS-specific, and the container path uses **neither**. SQLite FTS5 indexes are written synchronously alongside the row in the same transaction, and the PostgreSQL phase will use the same write-side approach with native PG search (FTS / `tsvector` / `pg_trgm`). There is no streams-shaped problem to solve in the container path; the entire CDC layer is gone. This is **not deferred** — there is no plan to add a SQLite/Postgres analogue of these packages.

**Container POC behavior.** None of the four packages above are wired into the container's plugin set. Code paths that *would* call them simply don't run in this runtime. Search updates flow through the in-process FTS5 shadow table maintained by the SQLite storage-ops packages.

**Future work.** None planned for the container path. The serverless code path is unchanged; existing AWS deployments keep using these packages as-is.

---

## OOS-2 — `webiny watch` via AWS IoT MQTT

**What it is.** Webiny's hot-reload mechanism uses AWS IoT MQTT to push compiled code into running Lambda functions during development. It's tightly coupled to the AWS IoT broker and the Lambda execution model.

**Why deferred.** Container DX has a much simpler answer for hot-reload: `tsx watch` or `nodemon` restart the long-lived Node process when source files change. Trying to unify the two watch experiences would mean abstracting over "how do I get new code into a running runtime" — a problem that has fundamentally different shapes in serverless and container.

**Container POC behavior.** `tsx watch` (or `nodemon`) is baked into the `api` service's dev command in `docker-compose.yml`. Source file changes restart the API process inside the container; the volume mount keeps state across restarts. Documented in stage 11's `07-developer-guide.md`.

**Future work.** None planned. The two watch stories live separately; that's fine.

---

## OOS-3 — Admin UI hosting via CloudFront + S3

**What it is.** In serverless production deployments, the Admin UI build output (a React SPA) is uploaded to an S3 bucket and served via CloudFront with a custom domain, edge caching, and origin failover.

**Why deferred.** Production-grade static hosting is a separate concern from "does Webiny run in a container at all." Serving the SPA through a CDN matters for production performance but is not on the critical path for the POC.

**Container POC behavior.** Fastify static plugin serves the Admin UI build output from inside the API container. One process, one volume mount, no extra service. Acceptable for local dev and small deployments. Not acceptable for high-traffic production.

**Future work.** A separate phase introduces a static-hosting story for container production deployments — likely a sidecar nginx/Caddy container, or guidance for users to put a CDN in front of their cluster ingress. The Fastify static plugin stays as the dev/small-deployment fallback.

---

## OOS-4 — Email delivery via AWS SES

**What it is.** Serverless deployments use SES through `@webiny/api-mailer`. The mailer abstraction supports multiple transports — SES is the default in serverless, but SMTP is also supported.

**Why deferred.** Almost no work needed. Mailpit is an SMTP catcher that runs in a tiny container (~10 MB image). The existing SMTP transport in `api-mailer` points at it via env config; no code changes.

**Container POC behavior.** `mailpit` container in `docker-compose.yml`. `api-mailer` configured with `SMTP_HOST=mailpit`, `SMTP_PORT=1025`. Mailpit's web UI on `:8025` shows captured emails — a great DX for testing email flows.

**Future work.** Production container deployments configure their own SMTP relay (or any of the existing transports `api-mailer` supports). No abstraction work needed.

---

## What about Kubernetes, ECS/Fargate, Cloud Run, etc.?

Production container deployment is out of scope for this POC (see ADR-3). The architecture is K8s-friendly by construction (stateless API, externalized state on a volume), so a follow-on phase that ships Helm charts, K8s manifests, or ECS/Fargate Pulumi modules is straightforward — but it's a separate effort.

## What about PostgreSQL?

Out of scope for this POC (see ADR-1). PostgreSQL is the natural next step after SQLite — same Drizzle dialect interface, different driver. The schema strategy (single-table mirror) is intentionally chosen so the same approach works for both. PostgreSQL is the next phase.

## What about splitting api / worker / scheduler / websocket containers?

Out of scope for this POC (see ADR-2). The runtime services (tasks, scheduler, WS) are abstracted such that splitting is additive — swap an in-process implementation for a Redis/NATS-backed one. Worth doing once a customer needs the scale.

## What about load testing, perf benchmarks, capacity planning?

Out of scope. The POC's job is correctness and DX, not throughput characterization. Benchmarks come later, when a real workload exists to measure against.
