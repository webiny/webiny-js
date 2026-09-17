# Debugger

Opt-in, permission-gated, per-request debug capture, surfaced in the GraphQL `extensions` property.

> **Revision 4.** Three review rounds so far. Revision 1 → 2 fixed: the DI container is
> per-invocation rather than process-wide, `graphql-after-query` fires for nested internal executions
> and is therefore not a response-assembly hook, and the `dev-tools` permission prefix is already in
> use with `fullAccess`. Revision 2 → 3 fixed two silent-failure bugs: **CloudFront strips the header
> before it reaches the Lambda** (§6.2) and **the DI default scope is not singleton** (§7.1).
> Revision 3 → 4 closes the remaining gaps: the flush plugin can itself throw and turn a 200 into a
> 500 (§7.3), the `RequestId` override would lose to its own default (§9), and several
> underspecifications that an implementer would plausibly get wrong.
>
> A fourth review also claimed the `<Api.Debugger.Disabled />` kill switch is one-shot because
> `ApiBuildParam` writes its generated file only when absent. **That claim is wrong and was not
> applied.** `BuildApp.ts:23` builds the workspace with `forceRebuild: true`, and
> `BuildAppWorkspaceService.ts:46-48` `fs.rmSync`s the whole app workspace first, so the file never
> exists when the extension runs. The kill switch works.

## 1. Problem

Clients running Webiny are frequently non-technical, and have no access to the code or to AWS. When
something misbehaves, they cannot read CloudWatch, cannot attach a profiler, and cannot be talked
through a devtools session. The only channel they can reliably use is the one they already have: the
Admin app in their browser.

This feature gives support a way to say: "grant yourself the debug role, turn on the switch,
reproduce the problem, send us the file". Everything else — where the data comes from, how it is
captured, how it is bounded — is in service of that sentence.

The first concrete requirement is capturing the OpenSearch query and the OpenSearch response for
Headless CMS entry listing.

## 2. Non-goals

- **This is not application logging.** `console.*` and `Logger` remain what they are: operational
  output that ends up in CloudWatch. The debugger is a separate channel with different data and a
  different destination.
- **Debug payloads never reach CloudWatch, stdout, or any persistent server-side store.** The HTTP
  response to a permitted identity is the only sink. Payloads are expected to contain sensitive data;
  that is the point of the feature, and it is why the transport is so tightly scoped.
- **Background tasks are out of scope for v1.** They have no HTTP response to attach to, and they need
  a different delivery mechanism. The transport abstraction exists so that work is additive later.
- **No redaction.** The data is deliberately sensitive. Scrubbing it would defeat the purpose. The
  controls are the permission, the explicit act of downloading a report, and the fact that nothing is
  captured unless someone asks for it.

## 3. Concepts

| Term          | Meaning                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Session**   | A capture window. Opened during the Fastify `preHandler` phase, closed once per HTTP response. Holds the buffer. |
| **Namespace** | A dotted identifier for a call site, e.g. `cms.os.list`. Used for filtering.                                     |
| **Entry**     | One captured record: namespace, sequence, timing, and a serialized payload.                                      |
| **Transport** | A sink that delivers a finished session somewhere. The only v1 transport writes to GraphQL `extensions`.         |

## 4. Architecture

Everything server-side lives in `@webiny/api-core`.

The decision to put it there follows from the dependency graph. `api-core` already depends on
`handler-graphql`, so the default GraphQL transport is straightforward to build, and it owns
`IdentityContext`, so the permission check needs no indirection.

`api-opensearch` is deliberately **not** instrumented. It is a pure gateway layer and takes no new
dependencies. The call sites go one layer up, in `api-headless-cms-ddb-es`. Logging at the caller
yields the same data — the query that was sent and the response that came back — without touching the
gateway.

```
packages/api-core/src/features/debugger/
├── abstractions.ts          Debugger, DebuggerTransport, all named types
├── Debugger.ts              implementation: session, buffer, caps, filtering
├── serialize.ts             the safe serializer
├── matchNamespace.ts        glob matching, incl. negation
├── GraphQLDebuggerTransport.ts
├── plugins.ts               BeforeHandlerPlugin (start) + HandlerResultPlugin (flush/discard)
├── feature.ts               DI registration
└── index.ts
```

`feature.ts` is registered from `ApiCoreFeature.register`
(`packages/api-core/src/ApiCoreFeature.ts`), which runs inside the `RegisterExtensionPlugin` returned
by `createApiCore()` — per request, before any `ContextPlugin`, so the `Debugger` is resolvable by the
time the ddb-es storage-operations factory is constructed.

Admin-side UI lives in a **new** package, `@webiny/dev-tools` (admin half). It does not exist today;
the existing dev-tools-adjacent packages are `app-graphql-playground` and `app-sdk-playground`.
Nothing app-side depends back on it, so the `app-admin` / `admin-ui` dependencies introduce no cycle.
`@webiny/background-tasks` is the precedent for a package that exports both `./api` and `./admin/*`
and is depended on by API packages.

## 5. Abstractions

No inline types — every parameter and return shape is a named interface.

### 5.1 Namespaces

`DebugNamespaces` is an empty interface that packages augment with their own prefix. The exact
precedent is `packages/background-tasks/src/api/features/TaskController/augmentation.ts:16`, which
already augments an `api-core` abstraction cross-package using the full specifier
(`@webiny/api-core/features/task/TaskController/abstractions.js`).

```ts
// @webiny/api-core
export interface DebugNamespaces {
  core: `core.${string}`;
}

export type DebugNamespace = DebugNamespaces[keyof DebugNamespaces];
```

```ts
// api-headless-cms-ddb-es claims its prefix
declare module "@webiny/api-core/features/debugger/abstractions.js" {
  interface DebugNamespaces {
    cms: `cms.${string}`;
  }
}
```

Two details that matter for implementation:

- **`api-core` seeds the interface with its own `core` prefix.** If `DebugNamespaces` is left empty,
  `DebugNamespaces[keyof DebugNamespaces]` resolves to `never`, and `api-core` — including its own
  unit tests — could not call `log()` at all.
- **The augmentation is cross-package, so the module specifier must be exact.** Every augmenting
  package uses the literal specifier `@webiny/api-core/features/debugger/abstractions.js` — a relative
  path will silently augment nothing. That specifier is valid because `api-core` exports `./*`.

### 5.2 Debugger

```ts
export interface IDebugPayloadFactory {
  (): unknown;
}

export interface IDebugEntry {
  seq: number;
  namespace: string;
  timestamp: number;
  elapsed: number;
  json: string;
  bytes: number;
}

export interface IDebugSession {
  namespaces: string[];
  startedAt: number;
  entries: IDebugEntry[];
  bytes: number;
  /** Entries discarded from the front of the buffer because the total budget was exceeded (§8.3). */
  dropped: number;
  /** True once any single entry's payload was replaced by the per-entry cap marker (§8.2). */
  truncated: boolean;
}

export interface IDebuggerStartParams {
  namespaces: string[];
}

export interface IDebugger {
  start(params: IDebuggerStartParams): void;
  log(namespace: DebugNamespace, payload: IDebugPayloadFactory): void;
  isEnabled(namespace: DebugNamespace): boolean;
  flush(target: IDebugDeliveryTarget): Promise<void>;
  discard(): void;
}

export const Debugger = createAbstraction<IDebugger>("Debugger");

export namespace Debugger {
  export type Interface = IDebugger;
}
```

`isEnabled` is public. It exists for guarding expensive work _surrounding_ a log call — building a
correlation id, timing a block. It is not needed to guard `log` itself, which already checks.

### 5.3 DebuggerTransport

```ts
export interface IDebugDeliveryTarget {
  type: string;
}

export interface IGraphQLDeliveryTarget extends IDebugDeliveryTarget {
  type: "graphql";
  /** Already resolved to the single result object — never the array (§7.4). */
  result: Record<string, any>;
}

export interface IDebuggerTransportDeliverParams {
  target: IDebugDeliveryTarget;
  session: IDebugSession;
}

export interface IDebuggerTransport {
  canDeliver(target: IDebugDeliveryTarget): boolean;
  deliver(params: IDebuggerTransportDeliverParams): Promise<void> | void;
}

export const DebuggerTransport = createAbstraction<IDebuggerTransport>("DebuggerTransport");

export namespace DebuggerTransport {
  export type Interface = IDebuggerTransport;
}
```

`canDeliver` / `deliver` mirrors `Compression.canCompress` / `compress`, registered with
`[[DebuggerTransport, { multiple: true }]]` the same way `CompressionHandler` does.

### 5.4 Division of responsibility

| Concern                                  | Owner               |
| ---------------------------------------- | ------------------- |
| Call-site API, no-op fast path           | `Debugger`          |
| Session lifetime                         | `Debugger`          |
| Namespace filtering                      | `Debugger`          |
| Callback invocation, serialization, caps | `Debugger`          |
| Buffer, byte accounting, drop policy     | `Debugger`          |
| Delivery, and only delivery              | `DebuggerTransport` |

Transports receive a finished session. They do not decide whether capture is on, and they do not
store anything.

**Consequence, stated explicitly:** a transport cannot stream. Everything is buffered in the Debugger
and handed over at flush. For a long-running background task emitting hundreds of megabytes this will
not work — which is consistent with background tasks being out of scope.

### 5.5 Delivery rules

- `flush` is `async`.
- Every transport whose `canDeliver` returns `true` delivers. Not first-match.
- Delivery runs in parallel via `Promise.allSettled`.
- **The session is read-only during delivery.** Transports receive the same object; one mutating
  `entries` while another iterates would corrupt output in the transport that did nothing wrong.
- **A failing transport must never fail the request.** Rejections are swallowed and reported with
  `console.error`. This is not optional politeness: `HandlerResultPlugin` errors are rethrown by the
  `preSerialization` hook (`packages/handler/src/fastify.ts:369`), so an unhandled throw inside flush
  would break the response.
- **Error logging must not leak the payload.** `console.error` goes to CloudWatch, so log only the
  error's `message` and `stack` (via `stringifyError`). Never log the session, the entries, the
  `result`, or the deliver params — `console.error("transport failed", { params })` would ship the
  whole debug session to exactly the sink §2 promises it never reaches.
- **Flush has a 2 second timeout.** In-memory delivery is instant, but a future network sink is not,
  and debug data is never worth making the app feel broken. The timer must be cleared once delivery
  settles — a dangling `setTimeout` keeps the event loop alive between the response and the Lambda
  freeze.
- No ordering guarantee between transports.
- **The GraphQL transport merges, it does not assign.** `result.extensions` may already be populated
  by the time the transport runs (§12), so it writes
  `result.extensions = { ...result.extensions, debug }`.

## 6. Activation

### 6.1 Header

Capture is requested per request with the `x-webiny-debug` header. Nothing is stored server-side.

| Header                          | `namespaces`                 |
| ------------------------------- | ---------------------------- |
| `x-webiny-debug: 1` or `true`   | `["*"]`                      |
| `x-webiny-debug: *`             | `["*"]`                      |
| `x-webiny-debug: cms.os.*`      | `["cms.os.*"]`               |
| `x-webiny-debug: cms.os.*,fm.*` | `["cms.os.*", "fm.*"]`       |
| `x-webiny-debug: *,!cms.os.*`   | everything except `cms.os.*` |
| absent, or present but empty    | no session                   |

**Capture-all is `*`, not a special case.** `minimatch` `*` matches any run of characters except `/`,
and namespaces contain dots, so `*` matches `cms.os.list`. Same matcher, same semantics, one code
path. `minimatch` is already a dependency of `api-core`.

**An empty header value means off, not all.** An empty value is almost always a client bug, and
defaulting that to full capture is the wrong failure direction.

**Negation is supported.** A namespace matches if at least one positive pattern matches and no
negative pattern matches.

**Do not pass `!`-prefixed patterns to `minimatch` unchanged.** `minimatch` has its own native
negation, and it inverts the result rather than reporting a match: `minimatch("cms.os.list",
"!cms.os.*")` is `false`, and `true` for every name that does _not_ match. An implementer who feeds
patterns straight through and treats `true` as a hit gets the exact opposite filter — `*,!cms.os.*`
would capture everything and exclude nothing. Strip the leading `!`, sort the pattern into the
positive or negative list, and match positively; pass `{ nonegate: true }` as a second guard.

**Parsing the header value.** Duplicate headers arrive **comma-joined** (`"cms.*, fm.*"`), both from
Node and from API Gateway v2, so the value is normally a plain `string`; the `string[]` form only
appears under `app.inject`. Split on `,` and **trim each token** — without the trim, the second and
subsequent patterns carry a leading space and match nothing. Handle the array form by joining first.
The parser must never throw on a malformed value (see §7.2).

Matching results are cached per session in a `Map` keyed by namespace, so `minimatch` runs once per
distinct namespace rather than once per call.

### 6.2 The header has to survive two whitelists

This is the single most likely way to ship a feature that does nothing. Both whitelists fail
**silently**: the header simply is not there, so no session starts, and the response carries no
`extensions.debug` at all — not even `{ enabled: false }`. Nothing logs, nothing errors.

**1. CloudFront drops it at the edge.**
`packages/project-aws/src/pulumi/apps/api/ApiCloudfront.ts:19-26`:

```ts
const forwardHeaders = [
  "Origin",
  "Authorization",
  "Accept",
  "Accept-Language",
  "X-Tenant",
  "X-Webiny-Sdk"
];
```

Applied as a `forwardedValues.headers` whitelist to the default cache behaviour and every ordered
behaviour. Any viewer header not on that list never reaches the Lambda. `X-Webiny-Debug` must be
added — `X-Tenant` and `X-Webiny-Sdk` are exactly this precedent.

Consequence for rollout: this is **infrastructure**, so it needs `yarn webiny deploy api`, not just a
code deploy. A deployment that takes only the Lambda code will have a debugger that cannot be turned
on.

(The blue/green router is unaffected — it forwards all viewer headers via
`Managed-AllViewerExceptHostHeader`.)

**2. CORS preflight rejects it in the browser.**
`x-webiny-debug` must be added to `whitelistedHeaders` in
`packages/api-core/src/legacy/security/plugins/secureHeaders.ts:3-11`. The list is sent verbatim as
`access-control-allow-headers`, and because `access-control-allow-credentials: true` is set and the
Admin client uses `credentials: "include"`, the wildcard fallback is not honoured.

**Preflight caching bites twice.** The origin sends `access-control-max-age: 86400` _and_
CloudFront caches OPTIONS (`cachedMethods` includes OPTIONS, `maxTtl: 86400`) without
`Access-Control-Request-Headers` in the cache key. So after deploying, browsers with a cached
preflight _and_ CloudFront itself can keep serving the old header list for up to a day. The release
note must tell operators to invalidate the CloudFront distribution after the infra deploy.

### 6.3 Who can turn it on

The Admin app owns a toggle. The toggle is client-side only: it sets a flag in `localStorage`, and an
Apollo link attaches the header to every request. The server stays stateless and re-checks the
permission on every request.

Any client can attach the header manually — a client's developer querying the API directly with a
token or an API key gets the same behaviour. That is intentional; it is the only way non-Admin
debugging works without inventing a second mechanism.

### 6.4 Which endpoints

All of them. The flush point is a `HandlerResultPlugin` registered by `api-core` (§7.3), which runs in
the Fastify `preSerialization` hook for every route — the main `/graphql` handler, every CMS
manage/read/preview handler, and any other route. No per-handler opt-in, and no changes to the
GraphQL execution path in `handler-graphql` or `api-headless-cms`.

(`handler-graphql` is still touched once, for the unrelated `debugPlugins` assignment fix — see §12.)

## 7. Session lifecycle

### 7.1 Storage

**The DI container is per Lambda invocation, not per process.**
`packages/handler-aws/src/gateway/index.ts:64-65` — `createHandler` returns a function that calls
`createBaseHandler(...)` on every event, building a new Fastify app, a new `Context`
(`packages/api/src/Context.ts:43` → `new Container()`), and therefore a new container. The same holds
for the `raw` and `sqs` handlers.

The session is therefore a plain **instance field on the `Debugger` implementation**. No
`AsyncLocalStorage`.

This also matches how the rest of the framework already works: the request-scoped identity is an
instance field on the `IdentityContext` singleton, and ALS is used there only for callback-scoped
_overrides_ (`withIdentity`), not for request scoping.

**The registration must be `.inSingletonScope()`.** This is not optional and not the default:

```ts
// packages/api-core/src/features/debugger/feature.ts
container.register(Debugger).inSingletonScope();
```

`container.register(Impl)` on its own registers a **transient**, so every `resolve()` returns a fresh
instance. `IdentityContext`, which stores request state in an instance field exactly as this design
does, registers `.inSingletonScope()` (`packages/api-core/src/features/security/IdentityContext/feature.ts:7`).
The nearest neighbour an implementer is likely to copy, `BuildParams`, does **not**
(`packages/api-core/src/features/buildParams/feature.ts:8`).

Get this wrong and the failure is silent and total: the start plugin opens a session on one instance,
the ddb-es call site buffers into a second, and the flush plugin resolves a third, sees no session,
and returns. Nothing is reported and nothing errors.

For the same reason, **the start and flush plugins must resolve `Debugger` from `context.container`
on each invocation** and never capture it when `createApiCore()` builds the plugin objects — those
objects are module-level and outlive any single container.

> Revision 1 specified `AsyncLocalStorage` on the premise that the container was process-wide. That
> premise was wrong. It also would not have worked: `start()` takes no callback, so the only available
> API is `enterWith()`, and `BeforeHandlerPlugin`s run after several `await`s inside the async
> `preHandler` hook, from which a store entered would not reliably reach the route handler.

### 7.2 Start

`start()` is called from a `BeforeHandlerPlugin`, exported as part of `createApiCore()`.

The header is read the way `authenticateUsingHttpHeader.ts` reads `authorization`:

```ts
const request = context.container.resolve(Request);
const header = request.headers["x-webiny-debug"];
```

`preHandler` binds the request into the container with `container.registerInstance(Request, request)`
(`packages/handler/src/fastify.ts:312-315`).

Three requirements:

- **`start()` always replaces any existing session.** Under a per-invocation container — which
  includes the standard test harnesses, since they also go through the `handler-aws` `createHandler`
  — nothing should survive between requests anyway. The rule exists for the paths that bypass that:
  direct `execute.ts` use and `app.inject()` against a reused app. A stale session leaking into the
  next request would mean one identity receiving another's entries, which is a data-exposure bug
  rather than merely a leak, so this is cheap insurance against a narrow but severe case.
- **The start plugin must never throw.** `ProcessBeforeHandlerPlugins` rethrows, which would turn a
  malformed header into a 500 for the whole request. Parse defensively; on anything unexpected, do not
  start a session.
- **Ordering.** `ContextPlugin`s run _before_ `BeforeHandlerPlugin`s
  (`packages/handler/src/fastify.ts:344-347`), so context setup is **not** captured. Authentication is
  itself a `BeforeHandlerPlugin`, registered from the project template's `security.ts` after
  `createApiCore()`, so the start plugin does run first — but this depends on that registration order
  and should be treated as a documented assumption, not a guarantee.

### 7.3 Gate and flush — once per HTTP response

**Flush does not happen in `graphql-after-query`.** That hook is not a response-assembly hook:
`packages/api-headless-cms/src/context.ts:103` — `getExecutableSchema` calls `processRequestBody`
_inside_ resolvers of the main API, used by `listEntriesResolver.ts:33`, `getEntryResolver.ts:23`,
`createEntryResolver.ts:21`, and four more. Every nested execution runs the after-query loop.

Flushing there would attach the session to a **nested** `result`, which the calling resolver discards
by reading only `result.data[...]`. The outer response would carry nothing. The existing
`debugPlugins` has this same defect today.

Instead, a single `HandlerResultPlugin` performs the gate and the flush. It runs in `preSerialization`
(`packages/handler/src/fastify.ts:354-372`), receives the **result object** before serialization, and
is awaited:

```ts
public async handle(context: T, result: any): Promise<any>
```

**The entire plugin body is wrapped in try/catch.** On any throw: `discard()`, `console.error` of the
error's `message`/`stack` only — never the session or the payload, per §5.5 — and return the payload
untouched. This is not the same guarantee as §5.5, which covers _transports_ — the gate
code that runs before any transport has its own throw sites, and `preSerialization` rethrows whatever
a `HandlerResultPlugin` throws (`packages/handler/src/fastify.ts:362-369`), which Fastify routes to
the error handler as a 500.

Without this, a request that would have succeeded fails **because someone turned debugging on**. The
known throw sites: `getPermission()` runs every registered `Authorizer`, some of which hit DynamoDB;
and `createRequestBody` throws a `WebinyError` on any body shape zod rejects
(`packages/handler-graphql/src/createRequestBody.ts`). The operation-name lookup for §9 gets its own
inner try/catch and falls back to `operations: []`.

**The plugin must mutate `result` in place.** `fastify.ts:360` ignores `handle()`'s return value and
`:371` returns the original payload object. `return { ...result, extensions }` compiles, typechecks,
and silently does nothing.

Sequence:

1. No session → return immediately.
2. Payload does not look like a GraphQL result → `discard()`. This covers asset delivery and every
   other non-GraphQL route. The predicate must be applied to **the last element for arrays**,
   otherwise every batched request is discarded:

   ```ts
   const target = Array.isArray(payload) ? payload.at(-1) : payload;
   const isGraphQLResult = isPlainObject(target) && ("data" in target || "errors" in target);
   ```

   Note this predicate is not airtight: the CMS 401 body is `{ data: null, error: {...} }`
   (`packages/api-headless-cms/src/graphql/handleRequest.ts:25-33`), which has a `data` key and would
   pass. The gate in steps 3-5 still applies, so the worst case is that an identity holding
   `debugger.capture` but lacking `cms.endpoint.<type>` sees `extensions.debug` merged onto a 401
   body. Harmless, and arguably useful — that is a permission problem worth debugging.

3. **Identity is anonymous → `discard()` and emit nothing at all.** Short-circuit before
   resolving permissions: `getPermission()` runs every registered `Authorizer`, some of which hit the
   database, so an unauthenticated caller spamming the header would otherwise cost real I/O.
4. **Authorization must be enabled.** `getPermission()` returns `{ name: "*" }` whenever authorization
   is disabled, so a flush occurring inside a `withoutAuthorization` scope would pass the check for
   _anyone_. Assert `identityContext.isAuthorizationEnabled()` and treat a disabled scope as deny.
5. `getPermission("<debug permission>")` → allowed: `flush({ type: "graphql", result })`; denied:
   `discard()` and emit `{ enabled: false }`.

Capture itself remains optimistic: the header is available at request start but the identity is not,
so buffering begins immediately and the decision is made at flush. Nothing is written anywhere until
the permission check passes.

**`log()` and `isEnabled()` additionally no-op for anonymous identities.** `Debugger` takes an
`IdentityContext` dependency for this. It is a cheap synchronous check — `getIdentity()` is
synchronous, `Identity.isAnonymous()` exists, and the authentication `BeforeHandlerPlugin` has
completed before any resolver runs — so it does not compromise the "`log()` stays synchronous and
near-free" rule that ruled out a lazy _permission_ check.

Two reasons, in order of importance:

1. **Defence in depth against accidental output.** The flush-time gate is one check standing between
   sensitive payloads and the wire. If a future code path flushes somewhere unexpected, or a transport
   is added that delivers before the gate runs, an empty buffer fails safe and a full one does not. An
   anonymous request should never have captured anything in the first place.
2. An unauthenticated caller who sets the header otherwise forces per-entry `JSON.stringify` of full
   OpenSearch responses and up to 4 MB of retention, all of it discarded at flush.

The flush-time permission check remains authoritative; this is a second, earlier gate, not a
replacement.

**Constraint this places on future call sites.** Identity is set by a `BeforeHandlerPlugin`, which
runs _after_ every `ContextPlugin` (`packages/handler/src/fastify.ts:344-347`). So instrumentation
placed in a `ContextPlugin` — or in a `BeforeHandlerPlugin` registered before `securityPlugins()` —
will see an anonymous identity and capture nothing, silently. Anything logged that early needs the
gate reconsidered rather than the call site debugged.

**An authenticated but unpermitted request sees `{ "enabled": false }` and nothing else.** No reason
string: enough for the Admin UI to say "debug is not available for your account", not enough to be an
oracle about which permissions an identity holds.

**An anonymous request sees nothing at all** — no `debug` key. `{ enabled: false }` on a public
endpoint would fingerprint the feature's presence and version to any unauthenticated caller, for no
benefit: nobody who is not logged in is going to be told to flip a switch.

**The flush plugin writes `{ enabled: false }` itself, not a transport.** §5.4 gives transports
delivery of a _finished session_, and a denial has no session to deliver.

**The plugin resolves the array; the transport never sees one.** The plugin picks the last element
once (§7.4) and passes that single object as `IGraphQLDeliveryTarget.result`. Both then use the same
merge helper — `result.extensions = { ...result.extensions, … }` (§5.5) — but only one layer knows
about batching. Splitting that rule across both is how the two drift apart.

### 7.4 Batched requests

`processRequestBody` loops an array body, producing one result per operation. The session spans the
whole HTTP request, and the `HandlerResultPlugin` receives the array.

**Attach once, to the last element.** Attaching to every element would duplicate the payload N times
against a 4 MB budget.

Because the Admin app uses `BatchHttpLink`, most Admin HTTP requests carry several operations, so the
payload will land on whichever operation happens to be last — usually unrelated to the one being
debugged. The Admin collector must therefore read `extensions.debug` from **every** operation result
and merge by `requestId` (§13). The output echoes the operation names covered by the session so a
reader can tell which query produced which entries.

### 7.5 Sessions that are never flushed

Verified paths where `start()` runs but the GraphQL path is never reached: a 401 from
`api-headless-cms/src/graphql/handleRequest.ts`, schema build failure in `createGraphQLHandler.ts`,
any throw in a later `BeforeHandlerPlugin` including authentication failures, every non-GraphQL route,
and Lambda timeouts.

**Framework error responses never reach the flush plugin.** Fastify skips `preSerialization` for
string and Buffer payloads, and `setErrorHandler`, the `onError` hook and the schema-build failure all
send `JSON.stringify(...)` strings. So no 500, and no framework-level error response, will ever carry
`extensions.debug`.

Two consequences:

- **The Admin collector must tolerate a response with no `debug` key**, including on the very request
  the client was trying to capture. A failing request is a plausible thing to be debugging, and this
  design cannot report on one that fails at the framework level. Worth stating in the support
  instructions.
- **Sessions on those paths are simply abandoned.** The per-invocation container means they die with
  the invocation; `start()` replacing unconditionally (§7.2) covers the reused-app case.

Note this does _not_ apply to GraphQL-level errors. A resolver that throws still produces a normal
`{ data, errors }` object through the usual route, so those responses do carry debug output.

## 8. Capture and serialization

### 8.1 The call

```ts
this.debugger.log("cms.os.list", () => ({ index, query, response, tookMs }));
```

The payload is a callback so that nothing is built when capture is off. When capture _is_ on, the
callback is **invoked immediately and the result is serialized immediately**:

```ts
entries.push({ seq, namespace, timestamp, elapsed, json: serialize(payload()), bytes });
```

After that line the closure is unreachable and so is the payload object — GC reclaims the OpenSearch
response as soon as the storage layer drops its own reference. What is retained is the serialized
string, which is exactly the bytes that will be shipped.

This matters more than it looks:

- Holding the **closure** instead would retain the entire enclosing scope — every local in that
  method, not just the fields you wanted.
- Holding the **object** would retain the payload graph until response assembly, and would leave the
  entry's size unknowable without serializing it anyway.
- Serializing at capture time means **sizes are known at capture time**, which is what makes bounded
  retention possible. Without it, a request issuing a thousand large OpenSearch queries would hold
  every response in memory and OOM long before anything could be dropped.

The CPU cost of `JSON.stringify` per entry is accepted. It is only ever paid during a debug session.

### 8.2 The serializer

A custom recursive walk producing a JSON-safe value, then `JSON.stringify`. Not `JSON.stringify` with
a replacer — a replacer sees values after `toJSON` has run, and makes depth and length caps awkward.

| Case                     | Handling                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| Circular reference       | `WeakSet` of seen objects → `"[Circular]"`                               |
| `Error`                  | `{ name, message, stack }` — otherwise serializes to `{}`                |
| `BigInt`                 | `"123n"` — bare `JSON.stringify` throws                                  |
| `Buffer` / `TypedArray`  | `"[Buffer 4096 bytes]"`, never contents                                  |
| `Map` / `Set`            | `{ __type: "Map", entries: [...] }` / array, both length-capped          |
| Function                 | `"[Function: name]"`                                                     |
| Symbol                   | `String(sym)`                                                            |
| `undefined` in an object | `"[undefined]"` — `JSON.stringify` drops the key, hiding that it existed |
| `Date`                   | ISO string via native `toJSON`                                           |
| Throwing getter          | try/catch per property → `"[Throws: message]"`                           |
| Depth exceeded           | `"[Depth limit]"`                                                        |
| String too long          | truncate + `"…(N more)"`                                                 |
| Array too long           | first N + `"…(N more items)"`                                            |
| Custom `toJSON`          | runs inside the same try/catch as everything else                        |

Two hard guarantees:

**The debugger can never break the request it observes.** The whole `log` body, callback invocation
included, sits in a try/catch. A throw becomes an entry recording the failure, not an exception.

**Output is always valid JSON.** Caps are applied during the walk, never by slicing the finished
string. If an entry still exceeds the per-entry byte cap after capped serialization, its payload is
replaced wholesale with `{ truncated: true, originalBytes: N }`.

### 8.3 Limits

All overridable by deploy-time configuration. None settable by the client.

| Knob              | Default      | Rationale                                                                                                           |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Total byte budget | 4 MB         | Uncompressed. See below.                                                                                            |
| Per-entry cap     | 512 KB       | Fits a realistic query + response after walk caps; small enough that one entry cannot take an eighth of the budget. |
| Entry count cap   | 10,000       | Runaway-loop guard only. Bytes are the real control.                                                                |
| Depth             | 10           | OpenSearch responses nest ~6-7 deep including `hits.hits._source`.                                                  |
| String length     | 10,000 chars | Long enough for a full query DSL; stops a base64 blob dominating.                                                   |
| Array length      | 100 items    | A 50-hit page survives intact; a 10,000-hit aggregation does not.                                                   |

**Overflow drops from the front** and increments `dropped`. The client reproduces the bug, so the
failure is at the end of the session; the tail is what matters. Truncation is reported in the output,
never silent.

**The budget is on the assembled total, not per namespace.** Per-namespace quotas mean a quiet
namespace's unused allowance is wasted while the namespace being debugged gets cut. The header filter
is the mechanism for "I only care about `cms.os.*`".

**No response-size safety valve.** `@fastify/compress` is registered globally with `threshold: 1024`,
so 4 MB of JSON logs is roughly 400-500 KB on the wire against Lambda's 6 MB response cap. A response
exceeding 6 MB compressed is unusable for reasons unrelated to debug data.

## 9. Output

```jsonc
"extensions": {
  "console": [ /* existing mechanism, untouched */ ],
  "debug": {
    "enabled": true,
    "requestId": "8f1c...",
    "namespaces": ["cms.os.*"],
    "operations": ["CmsListEntries"],
    "entries": [
      {
        "seq": 1,
        "namespace": "cms.os.list",
        "timestamp": 1758012345678,
        "elapsed": 412,
        "data": { "index": "…", "query": {}, "response": {}, "tookMs": 37 }
      }
    ],
    "bytes": 184320,
    "dropped": 0,
    "truncated": false
  }
}
```

Denied, or permission missing: `{ "enabled": false }` and nothing else.

Field rationale:

- **`requestId`** — the one value that finds the matching CloudWatch logs and X-Ray trace for the same
  invocation.
- **`seq`** — millisecond timestamps collide constantly; a monotonic counter preserves true order.
- **`elapsed`** — ms since session start. Absolute time correlates with CloudWatch; relative time is
  what you read when scanning a report.
- **`namespaces`** — echoed back so the report is self-describing.
- **`operations`** — the GraphQL operation names covered by this session, needed because a batched
  request attaches one session to one arbitrary operation's result (§7.4).
- **`bytes`** — total serialized size.

**`requestId` needs its own small abstraction, and it belongs in `@webiny/handler`.** Nothing
currently exposes the Lambda request id to `api-core`. It is reachable as
`request.awsLambda.context.awsRequestId` because `@fastify/aws-lambda` is configured with
`decorateRequest: true, decorationPropertyName: "awsLambda"`, but that is absent on the direct
`execute.ts` path used by tests.

It cannot be _defined_ in `api-core` and _registered_ by `handler-aws`: `handler-aws` does not depend
on `api-core`, and the dependency runs the other way. So:

- Define `RequestId` in `packages/handler/src/abstractions/`, alongside the existing `Request` and
  `Reply` abstractions.
- `@webiny/handler` registers a generated UUID as the default, in the same `preHandler` step that
  binds `Request` and `Reply`.
- `@webiny/handler-aws` overrides it with `awsRequestId` where available.

**The override must be registered from a `HandlerOnRequestPlugin`, not from the `createHandler`
closure.** `registerInstance` appends and `resolve` returns the **last** registration. The UUID
default is registered per request inside `preHandler` (`fastify.ts:312-315`). The natural-looking
place to register `awsRequestId` — the `createHandler` closure, where the Lambda `context` is in
scope — runs _before_ the app handles the request, so the UUID would be registered afterwards and
win.

The failure is silent and plausible-looking: `requestId` is populated with a well-formed UUID that
matches nothing in CloudWatch, which is the one job the field has.

`HandlerOnRequestPlugin` runs at `fastify.ts:343`, after the default is bound. Register it from
`handler-aws`'s `registerDefaultPlugins`, reading `request.awsLambda?.context?.awsRequestId`.

Test this on the gateway path specifically: assert the reported id equals the Lambda context's
`awsRequestId`, not merely that it is a non-empty string.

`yarn adio` will require any newly imported package to be declared directly in the relevant
`package.json`.

**`operations` also needs a capture mechanism.** `HandlerResultPlugin.handle` receives only
`(context, result)` — it never sees the request body. The hooks that do see it,
`graphql-before/after-query`, fire for nested executions and would report internal operation names
(§7.3). Instead, the flush plugin reads the body from the container:
`context.container.resolve(Request).body`, normalised the way `createRequestBody` already does, and
echoes the operation names from the **top-level** body only.

Entries are stored as strings in the buffer and `JSON.parse`d at assembly so `extensions` carries real
structured data rather than JSON-inside-JSON. Peak memory at assembly is roughly the budget times
three — about 12 MB on a 1 GB Lambda. Assembly only runs when a session was started _and_ the
permission check passed.

## 10. Permission

### 10.1 The `dev-tools` prefix is already taken

`packages/app-graphql-playground/src/PermissionsSchema.ts:3` and
`packages/app-sdk-playground/src/PermissionsSchema.ts:4` both declare
`createPermissionSchema({ prefix: "dev-tools", fullAccess: true, … })`. `fullAccess: true` emits
`{ name: "dev-tools.*" }`, and `IdentityContext.getPermission` pattern-matches with minimatch —
verified: `minimatch("dev-tools.debug", "dev-tools.*") === true`.

So a permission named `dev-tools.debug` **would be silently granted to every existing role that has
Dev Tools full access**, which is commonly granted just for GraphQL Playground access. On upgrade,
those users would gain the ability to extract internal payloads over HTTP without anyone granting it.

Separately, `Security.Permissions` keys renderers by name, so registering a second
`<Security.Permissions name="dev-tools" />` would replace the playground's entry in the role editor,
or be replaced by it, depending on mount order.

### 10.2 Decision: a distinct prefix

```ts
createPermissionSchema({
  prefix: "debugger",
  fullAccess: true,
  entities: [
    { id: "capture", title: "Debug capture", permission: "debugger.capture", scopes: ["full"] }
  ]
});
```

Checked as `getPermission("debugger.capture")`, registered in the role editor as
`<Security.Permissions name="debugger" title="Debugger" … />`.

> This deviates from the originally requested `dev-tools.debug`. The alternative — adding a `debug`
> entity to the existing `DEV_TOOLS_PERMISSIONS_SCHEMA` — keeps the nicer name but cannot avoid the
> `dev-tools.*` grant, so it would require an explicit release note telling every operator to audit
> roles holding Dev Tools full access. **Open for reversal if that trade is preferred.**

**The permission is granted through a role, and the identity type is irrelevant.** A logged-in user
and an API key resolve permissions the same way, so no special casing. Whoever has been granted it may
use it.

### 10.3 Full-access roles already hold it

`getPermission` matches with minimatch, so a full-access role's `*` matches `debugger.capture`, and
`filterOutCustomWbyAppsPermissions` only filters the `pb/fb/fm/cms/security/adminUsers/i18n` prefixes,
so `debugger.*` survives on non-AACL deployments too.

**Every full-access admin can therefore turn on debug capture with no role change.** This is
deliberate — it is how every other Webiny permission behaves, and a full-access admin can already read
every entry through the normal API. Debug capture shows them query internals, not data they could not
otherwise reach.

Two consequences to write down rather than discover later:

- **Support instructions must not say "grant yourself the debug role".** For most people who will be
  asked to do this, there is nothing to grant; the switch is already available. The role only matters
  for giving capture to someone who is _not_ a full-access admin.
- **There is no deliberate-grant moment.** The real risk in this feature is not the admin reading
  their own data, it is the report file leaving the customer's organisation. Since no one has to
  approve anything to enable capture, that decision point has to live in the UI instead — which is
  what the §13 banner and the explicit download step are for.

## 11. Kill switch

Configured in `webiny.config.tsx`, not as a raw environment variable:

```tsx
<Api.Debugger.Disabled value={true} />
```

Enabled by default; this explicitly disables it.

```tsx
// packages/project-aws/src/extensions/Debugger/Disabled.tsx
const paramsSchema = z.object({
  value: z.boolean().describe("Disable the API debugger for this deployment.")
});

export const Disabled = defineExtension({
  type: "Api/Debugger/Disabled",
  tags: { runtimeContext: "project" },
  description: "Explicitly disable the API debugger. Enabled by default.",
  paramsSchema,
  render(params) {
    return <BuildParam paramName="DebuggerDisabled" value={params.value} />;
  }
});
```

Registered in `packages/project-aws/src/api.ts` as `Debugger: { Disabled }`. The build-time extension
is modelled on `packages/project-aws/src/extensions/Cms/ModelFieldCompression.tsx`; the runtime read
is modelled on its consumer,
`packages/api-headless-cms/src/features/contentModel/ModelFieldCompression/ModelFieldCompression.ts:15`:

```ts
this.buildParams.get<boolean>("DebuggerDisabled");
```

`BuildParams` lives in `@webiny/api-core/features/buildParams/index.js`. When disabled, `start()` never
opens a session and `log` is a no-op regardless of headers or permissions.

Default-on is deliberate. Default-off would mean helping a client requires a redeploy by someone with
AWS access — precisely the situation this feature exists to avoid.

`BuildParam` is baked in at build time, so flipping it requires a redeploy. Correct for an
infrastructure-level control that no role can override; not a runtime panic button.

## 12. Changes to existing code

| Change                                        | File                                                                                     | Why                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Add `X-Webiny-Debug` to `forwardHeaders`      | `project-aws/src/pulumi/apps/api/ApiCloudfront.ts:19-26`                                 | Otherwise CloudFront drops the header at the edge (§6.2). **Infrastructure change — needs `yarn webiny deploy api`.** |
| Add `x-webiny-debug` to `whitelistedHeaders`  | `api-core/src/legacy/security/plugins/secureHeaders.ts:3-11`                             | Otherwise the CORS preflight blocks it (§6.2)                                                                         |
| Register start + flush plugins                | `api-core`, via `createApiCore()`                                                        | §7.2, §7.3                                                                                                            |
| Define `RequestId` abstraction + UUID default | `handler/src/abstractions/`, overridden from a `HandlerOnRequestPlugin` in `handler-aws` | §9                                                                                                                    |
| assign → merge                                | `handler-graphql/src/debugPlugins.ts:33`                                                 | See below                                                                                                             |

**The two debug mechanisms do not collide.** `graphql-after-query` runs inside `processRequestBody`,
before `reply.send` and therefore before `preSerialization`. So `debugPlugins` writes `extensions`
**first** and the debugger writes **last**. Since the debugger merges (§5.5), the response ends up
with both `console` and `debug`. Nothing about this feature requires changing `debugPlugins`.

What is worth fixing, independently: `debugPlugins` _assigns_, so it destroys anything already in
`result.extensions` — GraphQL execution's own extensions, or another `graphql-after-query` plugin
registered before it. Nothing in the repo does that today, so this is a latent trap rather than a live
bug. One line, and it makes the plugin behave like the debugger:

```ts
result.extensions = { ...result.extensions, console: [...(context.debug.logs || [])] };
```

Spreading `undefined` yields `{}`, so this covers both the "extensions already exists" and "does not
exist yet" cases.

**No change to `processRequestBody` is required.** Revision 1 proposed awaiting the
`graphql-after-query` loop so an async flush could run there. Moving the flush to a
`HandlerResultPlugin` removes that need entirely, along with its user-land blast radius — customer
plugins that are currently fire-and-forget keep their existing timing, and async rejections keep
failing silently rather than newly becoming 500s.

**Note on `debugPlugins`.** It stays, as a separate feature. Be aware that with `DEBUG=true` it already
ships all intercepted console output to any client with no permission check at all. That is existing
behaviour and out of scope here, but it undermines the new feature's posture on any deployment that
enables it, and deserves a line in the docs. If both write to `extensions`, `debug` and `console` are
distinct keys, so no collision rule is needed.

## 13. Admin UI

Lives in the new `@webiny/dev-tools` package, admin half. Hidden entirely for identities without
`debugger.capture`, using the app-side permissions abstraction the way `app-audit-logs` does.

Scope for v1: **toggle, collector, download.**

- **Toggle.** Persisted in `localStorage`, so it survives a refresh. An Apollo link reads it and
  attaches the header.
- **Banner.** A visible, persistent warning while capture is on. Required, not decorative — the toggle
  persists across reloads, so without it a session can be left running indefinitely.
- **Collector.** Reads `extensions.debug` from **every** operation result (§7.4) and merges by
  `requestId`. Held **in memory only**, cleared on refresh or tab close. Browser storage would leave
  customer data on a possibly shared machine long after the session, with no expiry anyone remembers
  to implement.
- **Download.** Writes `webiny-debug-<ISO timestamp>.json` containing the merged sessions plus Webiny
  version and tenant.

**Namespace selection: no runtime registry in v1.** The panel offers "Capture everything" plus an
advanced free-text field. With one instrumented namespace at launch, a registry is infrastructure for
a list of one, and a second place every namespace must be declared will drift from the call sites. The
header grammar and `start({ namespaces })` do not change when a registry is added later.

Upload-to-support is out of scope. The report payload shape is fixed here so adding it is additive.

## 14. First instrumentation

`cms.os.list` only. Other operations slot into the same grammar later.

**Location.** `packages/api-headless-cms-ddb-es/src/operations/entry/index.ts`, around the
`elasticsearch.search` call in the list path. Note there are two `elasticsearch.search` call sites in
that file; only the list one is instrumented in v1.

**Wiring.** `createEntriesStorageOperations` is a closure factory, not a class — there is no `this`.
`Debugger.Interface` must be added to `CreateEntriesStorageOperationsParams` and resolved from the
container one level up, in `createOpenSearchStorageOperations` (`feature.ts`), where the container is
available.

**Dependency.** `@webiny/api-core` is already listed in `packages/api-headless-cms-ddb-es/package.json`
under `devDependencies` (line 49). It must be **moved** to `dependencies` — it will now be imported by
shipped source, not just tests. Reaching it transitively through `api-headless-cms` is not sufficient;
`yarn adio` and `yarn webiny sync-dependencies` require directly imported packages to be declared, in
the right section.

**Payload.** Log `response.body` and `response.statusCode`, **not** the whole response object. The
OpenSearch client's `ApiResponse` includes `meta.connection.url` — the cluster endpoint — along with
request params and headers. Given the no-redaction stance, the payload must be chosen deliberately.

```ts
// success
debugger.log("cms.os.list", () => ({ index, query, body: response.body, statusCode, tookMs }));

// failure
debugger.log("cms.os.list", () => ({ index, query, error, tookMs }));
```

**Both failure exits must log.** The list path has two: a rethrow, and a _silently swallowed_
`index_not_found` that returns an empty result. The swallowed one is the more valuable of the two —
"the list came back empty and nothing was logged anywhere" is exactly the bug report this feature
exists to answer.

## 15. Testing

- **Serializer** — circular references, `Error`, `BigInt`, `Buffer`, `Map`/`Set`, throwing getters,
  depth cap, string cap, array cap, and the guarantee that a throwing callback produces an entry
  rather than an exception.
- **Namespace matcher** — `*`, prefix globs, comma-separated lists **with spaces after the commas**,
  negation (asserting `*,!cms.os.*` excludes rather than inverts), empty value, array-valued header.
- **Flush plugin never breaks the response** — a throwing `Authorizer` and a malformed request body
  each still yield the original status code with the header present.
- **Buffer** — per-entry cap replacement, total budget enforcement, drop-from-front with an accurate
  `dropped` count, entry count cap.
- **DI scope** — two `resolve(Debugger)` calls against the same container return the **same
  instance**. This is the regression test for the `.inSingletonScope()` bug, which is otherwise
  invisible: everything compiles, nothing throws, and no output is produced.
- **Session replacement** — must be a **unit** test: two `start()` calls on the same `Debugger`
  instance, asserting the second discards the first's entries. The integration form of this passes
  trivially and proves nothing: `RegisterExtensions` re-runs `ApiCoreFeature.register` on every
  request, appending a fresh registration, and singleton instances are keyed by registration object —
  so even on a reused app each request gets a new `Debugger` regardless of what `start()` does.
- **Result predicate** — a batched array flushes onto the last element rather than being discarded; a
  non-GraphQL payload is discarded.
- **Flush placement** — a query whose resolver performs a nested `processRequestBody` produces exactly
  one `extensions.debug`, on the outer response, not the nested one. This is the regression test for
  the revision-1 bug.
- **Gate** — anonymous identity never resolves permissions; a `withoutAuthorization` scope is treated
  as deny; denied requests emit `{ enabled: false }`.
- **Integration** — populated with the permission; `{ enabled: false }` without it; absent with no
  header; absent when the build param disables the feature; attached to the last element of a batched
  array.
- **Transports** — all matching transports receive the session; a throwing transport does not fail the
  request; the flush timeout is honoured.

## 16. Deferred

| Item                                     | Why deferred                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Background task capture                  | No HTTP response to attach to. Needs its own delivery and retention design. The transport abstraction is the seam. |
| Runtime namespace registry + checkbox UI | Infrastructure for a list of one at launch.                                                                        |
| Upload report to Webiny support          | Needs an endpoint, auth, storage, and a data-transfer consent decision.                                            |
| Streaming transports                     | The Debugger owns the buffer, so transports receive a finished session.                                            |
| `DEBUG=true` / `debugPlugins` posture    | Pre-existing unauthenticated console dump; out of scope but worth revisiting.                                      |

## 17. Decision log

| Decision                             | Chosen                                                                                                                     | Rejected                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Activation                           | Client toggle drives a per-request header; server stateless                                                                | Persisted server-side toggle                                                                 |
| Capture source                       | Explicit `debug` API only                                                                                                  | Teeing `Logger`; intercepting `console.*`                                                    |
| Destination                          | GraphQL `extensions` only                                                                                                  | Anything reaching CloudWatch                                                                 |
| Payload form                         | Lazy callback, invoked and serialized immediately                                                                          | Storing the closure; storing the object                                                      |
| Namespace typing                     | Augmented interface, template literal per prefix                                                                           | Free-form strings; enumerated full names                                                     |
| Capture-all                          | `"*"` through the normal matcher                                                                                           | Empty array; optional field; `startAll()`                                                    |
| Session storage                      | Instance field on a `.inSingletonScope()` `Debugger`, per invocation                                                       | `AsyncLocalStorage` (rev. 1 — wrong premise); transient registration (rev. 2 — silent no-op) |
| Flush point                          | One `HandlerResultPlugin` per HTTP response                                                                                | `graphql-after-query` (rev. 1 — fires on nested executions)                                  |
| `extensions` merge                   | In `GraphQLDebuggerTransport`                                                                                              | In `debugPlugins` (rev. 2 — runs first, cannot protect `debug`)                              |
| Header transport                     | Whitelisted at CloudFront **and** CORS                                                                                     | CORS only (rev. 2 — CloudFront drops it at the edge)                                         |
| `requestId` home                     | `@webiny/handler` abstraction, overridden by `handler-aws`                                                                 | Defined in `api-core`, registered by `handler-aws` (rev. 2 — wrong dependency direction)     |
| Anonymous response                   | No `debug` key at all                                                                                                      | `{ enabled: false }` (fingerprints the feature publicly)                                     |
| Permission gate                      | Optimistic capture, authoritative check at flush; authorization must be enabled                                            | Eager identity resolution                                                                    |
| Anonymous identities                 | Second, earlier gate: `log()` no-ops synchronously                                                                         | Relying on the flush gate alone                                                              |
| Lazy _permission_ check on first log | Rejected — permission resolution is async, `log()` must not be                                                             | —                                                                                            |
| Permission name                      | `debugger.capture`                                                                                                         | `dev-tools.debug` (already granted by existing `dev-tools.*`)                                |
| Buffer ownership                     | `Debugger`                                                                                                                 | `DebuggerTransport`                                                                          |
| Transport selection                  | All that can deliver, in parallel                                                                                          | First-match                                                                                  |
| Package                              | `api-core`                                                                                                                 | New leaf package; `@webiny/api`; `dev-tools/api`                                             |
| Instrumentation point                | `api-headless-cms-ddb-es`, with a direct `api-core` dependency                                                             | `api-opensearch` (pure gateway, stays untouched)                                             |
| OpenSearch payload                   | `response.body` + `statusCode`                                                                                             | Whole `ApiResponse` (leaks `meta.connection.url`)                                            |
| Existing `debugPlugins`              | Kept. Changed from assign to merge — not required by this feature, but it currently destroys any pre-existing `extensions` | Removed or reimplemented as a transport                                                      |
| Permission vs full access            | Full-access roles hold `debugger.capture` via `*`, as with every other permission                                          | Excluding it from wildcard matches                                                           |
| `processRequestBody`                 | Unchanged                                                                                                                  | Awaiting the after-query loop (rev. 1, no longer needed)                                     |
| Batched requests                     | Flush once onto the last result; collector merges by `requestId`                                                           | Attach to every result                                                                       |
| Collector storage                    | In-memory                                                                                                                  | `localStorage` / IndexedDB                                                                   |
| Toggle storage                       | `localStorage` + banner                                                                                                    | In-memory                                                                                    |
| Kill switch                          | `<Api.Debugger.Disabled />`, default enabled                                                                               | No kill switch; default disabled                                                             |
