# 08 — Concurrency Isolation in the Container Path

## Problem

Webiny was designed for the AWS Lambda runtime: **one process serves one
request**. Plugins, the DI container, and the top-level `app.webiny`
context object are all built and torn down per invocation, so the
codebase mutates them freely:

- ContextPlugins assign top-level fields wholesale (`context.cms = {...}`,
  `context.security = ...`, `context.aco = ...`).
- `setSchemaType` mutates `context.cms.type` mid-request.
- `IdentityContext` and `AuthorizationContext` cache the current
  identity / permissions on instance fields.
- Per-request `ContextPlugin`s call `container.register*` every time.
- The `PluginsContainer` accumulates per-endpoint variants of the same
  GraphQL schema plugin.

Under Lambda this is harmless — there's nothing to leak across, because
every request rebuilds the world. In the container path the same Node
process serves every request concurrently, and **any of those mutations
that lands on a shared object trampoles concurrent requests' state**.

The symptoms during development were a parade of unrelated-looking
failures that all traced back to the same root: `Unauthenticated`,
`Unknown type ArticleListWhereInput`, `argument "where" of type
"ArticleGetWhereInput!" is required`, `endpoint:null` schema-build
errors, ACO folders for one model showing up under another model, model
fields disappearing on refresh, performance degrading from 30 ms to 7+
seconds as the DI Container's internal Maps filled with duplicates.

Patching each occurrence one at a time would have been an indefinite
whack-a-mole. The container path closes the gap architecturally
instead, and a CI-gated stress test prevents regressions.

## The fix, in four pieces

### 1. Per-request `app.webiny` fields via `AsyncLocalStorage`

`packages/handler-node/src/perRequestContext.ts`

The handler-node bootstrap installs an `onRequest` Fastify hook that
opens a fresh `AsyncLocalStorage` store at the start of every request,
and replaces a fixed list of `app.webiny.<field>` properties with
getter/setters that read from / write to that store.

The audited per-request fields:

```
request, reply,                           // @webiny/handler
security, tenancy, adminUsers, wcp,        // @webiny/api-core
cms,                                       // @webiny/api-headless-cms
aco, auditLogs, websockets, tasks,         // feature packages
db,                                        // handler-db / extensions/api inMemoryDb
debug                                      // handler-graphql per-request log buffer
```

The list is finite, manually curated, and matches what `ContextPlugin`s
actually assign in the source. New entries are added when CI's
concurrent stress test catches a regression.

Outside an HTTP request (boot-time, background tasks not initiated by
HTTP), each property falls through to a per-property fallback slot, so
"shared field" semantics are preserved for code paths that legitimately
expect them.

`scope.enterWith(store)` is used rather than `scope.run(store, cb)` —
Fastify's hook chain continues asynchronously after `done()` returns,
and `enterWith` mutates the current async resource's store so the
subsequent `preHandler` / `ContextPlugin` / route-handler tasks
inherit it.

### 2. DI Container registration dedupe

`packages/handler-node/src/dedupeContainerRegistrations.ts`

`@webiny/di`'s `Container#register*` methods append to internal Maps
keyed by abstraction token. Webiny's per-request `ContextPlugin`s
re-call them every request (e.g.
`container.registerInstance(ModelCache, createMemoryCache())`). Under
Lambda this is harmless — every invocation gets a fresh Container, so
only the first call ever runs anyway. In the container path the calls
accumulate linearly with uptime; after ~50 requests `resolve` walks 50
copies of every registration, latency climbs from 30 ms p50 to 7+
seconds, memory grows from ~160 MB to 1.6 GB.

The patch makes `Container.prototype.register*` idempotent:

- **`register(impl)`** — dedup by `(abstraction.token, implementation)`.
  Distinct implementations against the same abstraction (the
  multiple-impl pattern, e.g. multiple `OidcIdentityProvider`s)
  keep working because the dedup key includes the payload.
- **`registerInstance` / `registerFactory`** — token-level dedup
  (first wins) for everything except a small allowlist:
  - `Request`, `CmsContext`, `PluginsContainer` are genuinely
    per-request and use **overwrite-last** semantics so `resolve`
    always returns the current request's value.
- **`registerDecorator`** — same `(token, decorator)` dedup as
  `register`.

The first-wins token rule is critical for stateful singletons that
cache the resolved value: `ModelsFetcher`, `UpdateModelRepository`,
etc. all read `ModelCache` via DI — if `registerInstance(ModelCache,
fresh)` were re-run each request, the singletons that constructed
first would capture cache #1, while singletons constructed later
would capture cache #2, and writes to one wouldn't show up on reads
through the other.

The allowlist (Request / CmsContext / PluginsContainer) is the
precise set where freezing the first request's value would be
incorrect, validated against the concurrent stress test.

### 3. Stateful singletons — request-scoped via their own ALS

`packages/api-core/src/features/security/IdentityContext/IdentityContext.ts`
`packages/api-core/src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts`

`IdentityContext` and `AuthorizationContext` are DI singletons that
held `currentIdentity` / `permissions cache` on instance fields. The
DI dedupe (above) means we keep one instance for the whole process, so
those instance fields would be globally shared.

Each singleton now carries its own `AsyncLocalStorage<RequestStore>`
for the genuinely per-request slice of its state:

- `IdentityContext.requestIdentityStorage` holds `{ identity }`.
- `AuthorizationContext.requestPermissionsStorage` holds the
  `permissions` array and the in-flight loader promise.

The singletons expose `enterIdentityRequestScope()` /
`enterAuthorizationRequestScope()` that handler-node's `onRequest`
hook calls alongside opening the main context scope. Reads check the
ALS first and fall back to the instance field for boot-time / non-HTTP
code paths. The `withIdentity()` API still works — it pushes its own
inner ALS scope as before.

### 4. Per-endpoint plugin pinning

`packages/api-headless-cms/src/graphql/schema/*.ts`
`packages/api-headless-cms/src/utils/getSchemaFromFieldPlugins.ts`
`packages/api-headless-cms/src/export/graphql/index.ts`

GraphQL schema plugins (`headless-cms.graphql.schema.<endpoint>.*`,
field-type plugins, content-models, content-model-groups, content-entries,
the export plugin) come in three variants — manage, read, preview —
with different SDL each (the manage variant defines mutations + their
input types, read/preview don't). Under Lambda that's fine: each
invocation builds the schema for one endpoint, registers only the
matching variants, and the schema build sees no conflicts.

In the container path, `PluginsContainer` is long-lived. A CMS request
to `/cms/manage` registers manage-variant plugins; a subsequent request
to `/cms/read` registers read-variant plugins **without unregistering
the manage variants**. The schema build for `/cms/read` then sees both
variants of the same plugin name — produces conflicting query
signatures, dangling type references, or accidentally drops mutations.

Each per-endpoint plugin now carries:

```ts
isApplicable: ctx => ctx.cms.type === <endpoint>
```

The schema-build path filters on `isApplicable` before merging SDL, so
the wrong variant can't leak. This is a small change to the plugin
factories, but it's the difference between "schema builds work" and
"schema builds intermittently fail under concurrent traffic". The
field-type per-endpoint plugins (`createGraphQLSchemaPluginFromFieldPlugins`)
get the same treatment in `defaultCreatePlugin`.

## Verifying — the stress test

`scripts/containerStressTest.mjs` (`yarn container:stress`)

The script issues 20 rounds × 5 parallel × 10 lanes = 1000 mixed
concurrent requests, hitting every code path that historically caused
cross-request leakage:

```
manage:listContentModels       /cms/manage
manage:getContentModel         /cms/manage
manage:listEntries             /cms/manage
read:listEntries               /cms/read
graphql:cms.listEntries        /graphql
graphql:adminUsers.getCurrentUser   /graphql
graphql:fileManager.listFiles  /graphql
graphql:aco.listFolders.cms    /graphql
graphql:aco.listFolders.fm     /graphql
graphql:security.login         /graphql
```

Failure detection — these regex patterns mark a body as a concurrency
regression rather than a normal not-found:

```
INVALID_GRAPHQL_SCHEMA
Unknown type ".*ListWhereInput"
argument "where" of type ".*GetWhereInput!" is required
Unauthenticated!
Not allowed to access "(manage|read|preview)" endpoint
Cannot read properties of undefined (reading 'isAdmin')
endpoint":\s*null.*INVALID
```

Any future change to request scoping, DI singletons, or per-endpoint
schema plugins should pass this test before merge. CI runs it on every
PR that touches the container path (see `09-ci-integration.md` if/when
that's promoted out of `03-refactor-plan.md`).

## Why this scales beyond the POC

The pattern is **isolate per-request state at the runtime boundary,
once**, and keep the rest of Webiny untouched. The four pieces above
are additive — none of them break the Lambda runtime path
(`handler-aws` doesn't install the per-request scope, `@webiny/di` is
patched only by `dedupeContainerRegistrations` which handler-node
calls; the per-endpoint `isApplicable` filters are no-ops when only
one endpoint's plugins are registered, which is what Lambda does).

In production load profiles, AsyncLocalStorage adds ~1-2 µs per access
(measured on Node 22; LTS-stable since v16) — orders of magnitude below
the request-handling baseline. The DI dedup turns Map-append into
Map-has, also constant-time. The plugin filter is one boolean per
plugin per schema build (which itself is cached). None of these pieces
introduce per-request allocations beyond the `enterWith({})` store
object.

The remaining concurrency-correctness exposure is **whichever per-request
state isn't yet covered by the four mechanisms above** — i.e., new
top-level `app.webiny` fields added to Webiny over time, new DI
singletons added with internal mutable state, or new plugin types
that need per-endpoint pinning. The stress test is the durability
gate: any of those regressions surface as a failing run, and the
fix is to extend the relevant list (PER_REQUEST_FIELDS,
PER_REQUEST_ABSTRACTIONS, the singleton's request-storage) — not to
re-architect.

## Where to look

| File | What it does |
|---|---|
| `packages/handler-node/src/perRequestContext.ts` | ALS-scopes shared `app.webiny.<field>` accessors. |
| `packages/handler-node/src/dedupeContainerRegistrations.ts` | Patches `@webiny/di` Container.prototype to be idempotent. |
| `packages/api-core/src/features/security/IdentityContext/IdentityContext.ts` | Per-request identity ALS + `enterIdentityRequestScope()`. |
| `packages/api-core/src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts` | Per-request permissions ALS + `enterAuthorizationRequestScope()`. |
| `packages/api-headless-cms/src/utils/getSchemaFromFieldPlugins.ts` | Field-type plugin pinning via `isApplicable`. |
| `packages/api-headless-cms/src/graphql/schema/contentModels.ts` | Content-model schema plugin pinning. |
| `packages/api-headless-cms/src/graphql/schema/contentModelGroups.ts` | Content-model-group schema plugin pinning. |
| `packages/api-headless-cms/src/graphql/schema/contentEntries.ts` | Content-entry schema plugin pinning. |
| `packages/api-headless-cms/src/graphql/schema/schemaPlugins.ts` | Per-model schema plugin pinning. |
| `packages/api-headless-cms/src/export/graphql/index.ts` | Export plugin pinned to manage. |
| `scripts/containerStressTest.mjs` | The stress test. |
