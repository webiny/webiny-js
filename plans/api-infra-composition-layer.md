# Plan: `api-infra` composition layer

## Motivation

Three problems share one root cause — there is **no layer that owns "wire the domain into a transport,"** so that wiring leaked into the wrong places:

1. **Domain → infra leak.** `api-core` implements `RequestInitializer` (an event-handler-core contract) to schedule the WCP license refresh — domain reaching _out_ to infra.
2. **Infra → domain leak (already present).** `event-handler-aws` is _not_ transport-agnostic: `ApiGatewayIdentityLoaderDecorator`, `ApiGatewayTenantLoaderDecorator`, and `S3TenantLoaderDecorator` all import `@webiny/api-core/features/requestContext`. The transport package knows about the domain's identity/tenant model.
3. **The composition root is untestable.** The real handler wiring (which ~30 features register, in what order, fresh-install behavior) lives in `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts` — a **scaffolding template**, exercised only by full e2e deploy. This is why the `No registration found for FileModel` install failure only surfaces in CI e2e and never in a unit/integration test.

## Target layering

```
transport infra (agnostic)      domain / app              composition (marries the two)
──────────────────────────      ────────────────          ─────────────────────────────
event-handler-core              api-core                  api-infra           (agnostic)
event-handler-aws               api-headless-cms          api-infra-aws       (AWS)
event-handler-server            api-aco, api-file-manager api-infra-server    (Node server, future)
   ...                             ... (all api-*)
```

- **event-handler-\*** — pure transport: request loop (`createHandler`), transports, translators, event types, HTTP abstractions, the `RequestInitializer` / `RequestContextInitializer` **contracts**. **No `api-*` dependency.**
- **api-\*** — domain/app. **No transport (event-handler) dependency.**
- **api-infra / -aws / -server** — the ONLY layer allowed to depend on both. Owns the composition root, the identity/tenant loader decorators, `WcpLicenseInitializer`, and the `createWebinyApiHandler` factory.

Dependency directions (all inward / acyclic):

- `api-infra` → `api-*` + `event-handler-core` (contracts)
- `api-infra-aws` → `api-infra` + `event-handler-aws` + `api-*` (storage-variant features)
- `event-handler-aws` → `event-handler-core` (drops its `api-core` dep in Phase 3)
- `api-core` → drops its `event-handler-core` dep in Phase 4

## New packages

### `@webiny/api-infra` (transport-agnostic composition)

- `registerApiRequestStack(container, config)` — registers the full API feature set in the correct order: `ApiCoreFeature` (+ chosen storage adapter feature), `HeadlessCmsFeature`, `AcoFeature`, `FileManager*`, `Mailer`, `Webhooks`, `Workflows`, `Scheduler`, background tasks, `WcpLicenseInitializer`, etc.
- `config` selects the storage variant (ddb / ddb-os / sql) and carries `documentClient`, `wcpLicense`, endpoints — whatever the template passes today.
- **Owns `WcpLicenseInitializer`** (implements `RequestInitializer` from event-handler-core, uses `WcpLicenseProvider` from api-core) — the layer allowed to depend on both.
- Deps: `api-*`, `event-handler-core`.

### `@webiny/api-infra-aws` (AWS composition + handler factory)

- `createWebinyApiHandler(config)` = `createLambdaHandler({ root: c => { ...register AWS transport + loaders + registerApiRequestStack(c, config) } })`.
- Registers **AWS transport** features from event-handler-aws (`ApiGatewayFeature` transport-only, event types, `BackgroundTaskEventType`/`WebSocketEventType`) **and the api-core-coupled loader decorators** moved out of event-handler-aws (`ApiGatewayIdentityLoaderDecorator`, `ApiGatewayTenantLoaderDecorator`, `S3TenantLoaderDecorator`).
- Deps: `api-infra`, `event-handler-aws`, `api-*`.

### `@webiny/api-infra-server` (future)

- `createWebinyApiHandler(config)` over `createNodeHandler` (event-handler-server). Shares `registerApiRequestStack` from `api-infra`. Build when a server app is real; scaffold-only for now.

## What moves where

| Currently in                                                                                                          | Moves to                                                                                     | Note                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `_templates/.../api/graphql/src/index.ts` root callback (the ~30-feature comp root)                                   | `api-infra-aws` `createWebinyApiHandler` + `api-infra` `registerApiRequestStack`             | Preserve registration ORDER exactly (ModelCache/extensions are order-sensitive — see [[request-lifecycle-di]] wbyLanguage bug). |
| `event-handler-aws` `ApiGatewayIdentityLoaderDecorator`, `ApiGatewayTenantLoaderDecorator`, `S3TenantLoaderDecorator` | `api-infra-aws`                                                                              | These are the api-core→requestContext leak.                                                                                     |
| `event-handler-aws` `ApiGatewayFeature`                                                                               | split: transport part stays; auth/tenant-establishment registration moves to `api-infra-aws` | Makes event-handler-aws agnostic.                                                                                               |
| `api-core` `WcpLicenseInitializer`                                                                                    | `api-infra`                                                                                  | api-core keeps `WcpLicenseProvider` (+ WcpContext) only.                                                                        |
| template files                                                                                                        | thin shim: `export const handler = createWebinyApiHandler(config)`                           | ~3 lines; nothing to test.                                                                                                      |

## Phases (each independently shippable)

**Phase 1 — extract the comp root (biggest win, no behavior change).**

- Create `@webiny/api-infra` + `@webiny/api-infra-aws`.
- Move the graphql template's root wiring verbatim into `registerApiRequestStack` + `createWebinyApiHandler`, preserving order. Do the same for the websockets template.
- Templates become shims. Verify a scaffolded project still builds/deploys.

**Phase 2 — the test that would have caught the current CI red.**

- In `api-infra-aws`, add an integration test: boot `createWebinyApiHandler` against **fresh/empty** storage, run the install mutation end-to-end, assert it succeeds (no `No registration found for FileModel`, install completes). Add a re-install/steady-state case too.
- This is the payoff: composition + fresh-install bugs caught pre-deploy instead of in e2e.

**Phase 3 — make event-handler-aws agnostic.**

- Move the three loader decorators + the auth/tenant-establishment registration out of event-handler-aws into `api-infra-aws`; split `ApiGatewayFeature` into transport-only.
- Drop `@webiny/api-core` from `event-handler-aws` deps. Verify no other api-\* imports remain.

**Phase 4 — WCP off api-core.**

- Move `WcpLicenseInitializer` → `api-infra`; register it in `registerApiRequestStack`.
- `WcpFeature` (api-core) keeps only `WcpLicenseProvider` + `WcpContext`; drop the initializer + the event-handler-core import.
- Drop `@webiny/event-handler-core` from `api-core` deps → **api-core is transport-clean.**
- Guard: Phase-2 integration test asserts the WCP license is refreshed (not `NullLicense`) — closes the 797e9d1067 "initializer never registered" footgun.

**Phase 5 (future) — `api-infra-server`.**

- `createWebinyApiHandler` over event-handler-server; reuses `registerApiRequestStack`. WCP + all features work on the server transport for free.

## Risks / gotchas

- **Registration order is load-bearing** (ModelCache filled by early initializers; code-defined CMS models must register before any lister — [[request-lifecycle-di]]). Move the comp root verbatim; do not "tidy" order.
- **Storage variant** (ddb / ddb-os / sql): `registerApiRequestStack` must be parameterized; the OpenSearch template variant (`_templates/extensions/OpenSearch/...`) is a second comp root to reconcile.
- **Package cycles**: after Phase 3+4, verify `api-core` has zero event-handler imports and `event-handler-aws` has zero api-\* imports (grep + `yarn adio`).
- **Templates are scaffolded** (`_templates`): the shim must be valid generated code; test project generation, not just the monorepo build.
- **Test harnesses** (`createCmsTestHandler`, `useContextHandler`, etc.) are a parallel composition — decide whether they eventually route through `registerApiRequestStack` too (prevents test/prod drift — the original [[shared api handler factory]] goal), or stay separate for now.

## Verification

- Per-package builds for the new packages + `api-core` + `event-handler-aws` + `event-handler-core`.
- `yarn adio` (dep hygiene) confirms the severed edges.
- Phase-2 fresh-install integration test green (the FileModel guard).
- Full e2e (ddb + ddb-os) green — the install-wizard cypress test that's currently red.

## Relation to existing memory

- Realizes [[shared api handler factory]] (`registerApiRequestStack` + `createWebinyApiHandler`).
- Properly resolves [[layering: infra in domain]] — the answer is a dedicated composition layer, not "event-handler is the kernel" nor "event-handler depends on api."
- Subsumes the WCP `RequestInitializer` relocation debate.
- The Phase-2 test targets the current CI red (see the FileModel/fresh-install investigation).
