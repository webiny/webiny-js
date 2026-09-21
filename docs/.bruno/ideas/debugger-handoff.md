# Debugger — session handoff

Working notes for picking this up. The design document is `plans/debugger.md` (already on
`release/6.4.12`); it is revision 4 and several decisions in it have since been superseded — see
§"Where the implementation diverges from the spec" below.

## State

- **Branch:** `bruno/fix/6.4.12/debug-logger-tool`, based on `release/6.4.12`
- **PR:** #5734 → `release/6.4.12`
- **Local HEAD:** `b89e71da1f`
- **Remote HEAD:** `ec67cfcd46` — **the branch has diverged**

```
local only:   b89e71da1f  feat: list the Debugger under Dev Tools permissions
remote only:  ec67cfcd46  chore: ai fix static analysis [skip-ai]
```

Reconcile before doing anything else. Nothing was pushed after `ebed4fb86b`.

- **Uncommitted:** `webiny.config.tsx` only. Line 31 is `<Infra.OpenSearch enabled={true} />`, which
  **must not be committed** — it is a local-only setting for this dev environment.
- Full build, `yarn lint` and the 23 debugger unit tests all pass at `b89e71da1f`.

## What the feature does

A developer marks a call site with `debugger.log("cms.os.list", () => payload)`. When the request's
identity holds `dev-tools.debug`, those payloads come back in the GraphQL response under
`extensions.debug`. The Admin app collects them and offers a download.

The point is clients who cannot reach AWS or the code: they reproduce a problem and send a file.

Debug payloads are expected to contain record content and **never** reach CloudWatch. The response to
a permitted identity is the only sink.

### Server (`packages/api-core/src/features/debugger/`)

| File | Role |
| --- | --- |
| `abstractions.ts` | `Debugger`, `DebuggerTransport`, the augmentable `DebugNamespaces` registry |
| `Debugger.ts` | Session, buffer, caps, namespace filter. **Must stay `.inSingletonScope()`** |
| `serialize.ts` | Safe serializer — never throws, always valid JSON |
| `matchNamespace.ts` | Glob matching with `!` exclusion, header parsing |
| `GraphQLDebuggerTransport.ts` | Writes `extensions.debug`, skips empty sessions |
| `plugins.ts` | Start plugin + flush plugin (the permission gate) |
| `permissions.ts` | `canCaptureDebugData()` — exact permission match |

Flow: a `BeforeHandlerPlugin` opens a session on **every** request. A `HandlerResultPlugin` running in
Fastify's `preSerialization` hook checks the permission and either attaches the session or discards
it.

### Admin (`packages/app-admin/src/features/debugger/`)

`DebuggerStore` (toggle + collected sessions), `debuggerLink.ts` (collects from responses),
`DebuggerIndicator.tsx` (header tag), `DebuggerView.tsx` (panel at `/debugger`), `report.ts`
(download), `permissions.ts` (`useCanCaptureDebugData`).

### Instrumentation

One call site: `cms.os.list` in
`packages/api-headless-cms-ddb-es/src/operations/entry/index.ts`, on both exits of the list search —
including the one that silently swallows `index_not_found` and returns an empty result.

## Where the implementation diverges from the spec

`plans/debugger.md` was written before these were decided. The code is right; the document is stale.

1. **No request header.** The spec has the client send `x-webiny-debug`. It does not. Adding a header
   to the CORS allow-list means it lands in preflight responses cached at CloudFront and in the
   browser for a day, so rolling it out breaks requests intermittently with no error anywhere except
   the console. **This actually happened during testing.** The server decides from permissions alone;
   the header is still honoured when present, for direct API clients. The client code that sent it is
   commented out in `debuggerLink.ts`.
2. **Capture starts automatically** for an identity holding the permission. The spec has an explicit
   opt-in toggle. The toggle still exists as an off-switch, and an explicit "off" is persisted so the
   permission does not re-enable it.
3. **The permission is matched exactly.** `canAccess` grants on `*` and `dev-tools.*`, so every
   full-access administrator would have had capture on permanently. Both gates now require a literal
   `dev-tools.debug`. **This is deliberately unlike every other permission in Webiny** — the reason is
   that this one starts data collection rather than unlocking a screen.
4. **Undefined object properties are dropped** rather than marked, matching `JSON.stringify`, so a
   logged wire payload is byte-equivalent to what was sent. Array elements keep a marker, because
   dropping one would shift every later index.
5. **Serializer markers are `#`-prefixed** — `#[Circular]`, `#[Undefined value]`, `#[Depth limit]` —
   so a substituted value cannot be mistaken for real data.
6. **No Dev Tools menu entry.** The header tag is the way in; it downloads on click. The panel is
   still routed at `/debugger` but nothing links to it.

## Things that will bite

- **`Debugger` must be registered `.inSingletonScope()`.** The session is instance state. A transient
  registration gives the start plugin, the call sites and the flush plugin three different instances,
  and the failure is completely silent — nothing throws, nothing is captured.
- **Components reading permissions or the store must be `observer`s.** `Identity` is
  `makeAutoObservable`, and the first render happens before it loads. This has already caused one bug
  where the menu never appeared.
- **CloudFront caches OPTIONS** without `Access-Control-Request-Headers` in the cache key, and the
  origin sends `access-control-max-age: 86400`. Any future change to `whitelistedHeaders` produces
  intermittent CORS failures for up to a day. Flagged in the PR as worth fixing separately — either
  drop OPTIONS from `cachedMethods` or lower the max-age.
- **`yarn build` reports "cached" after a dependency install** and can pass while something is
  broken. Use `--no-cache` when it matters.
- **Stray characters have landed in files three times** (`truewebiny.config.tsx`, `Date.now();c`,
  `w;`) from keystrokes reaching the IDE. Two failed the build; one sat in the tree looking
  plausible. Check `git diff` before committing.

## Not done

- **No integration test.** The important one asserts that a CMS resolver's nested `processRequestBody`
  produces exactly **one** `extensions.debug`, on the outer response. That is the regression test for
  the bug that invalidated revision 1 of the spec. Also worth covering: present with the permission,
  `{ enabled: false }` without, absent entirely when anonymous.
- **Only `cms.os.list` is instrumented**, and it only runs on OpenSearch deployments. This project is
  DynamoDB-only (`<Infra.OpenSearch enabled={false} />` in the committed config), so **capture
  produces nothing here**, which is indistinguishable from a broken feature. Instrumenting the DDB
  storage operations (`cms.ddb.list`) would make it testable on the majority deployment type.
- **The namespace filter in the panel is inert** for Admin traffic, since the client no longer sends
  the header. Either remove it or move filtering server-side.
- **Dead exports** left from earlier approaches: `DEBUGGER_PERMISSIONS_SCHEMA`, `DebuggerPermissions`,
  `useDebuggerPermissions` in `app-admin`, and `DebuggerPermissions` / `DebuggerPermissionsFeature`
  in `api-core`. Nothing references them.
- **`dev-tools` schema is duplicated** in `app-graphql-playground` and `app-sdk-playground`, and now
  both declare `dev-tools.debug` — a permission neither package knows anything about. One owner would
  be better.
- **`plans/debugger.md` is stale** against the six divergences above.

## Deploying

The API distribution needs `yarn webiny deploy api`, not just a code deploy, because
`x-webiny-debug` was added to CloudFront's `forwardHeaders` — plus an invalidation, since OPTIONS
responses are cached for a day. The header is no longer sent by Admin, but direct API clients can
still use it.

Admin is a separate build and deploy.

## Outstanding from the incident

A debug report containing customer data was committed and pushed, then removed by rewriting history
and force-pushing. **GitHub still holds the unreachable objects** — removing them needs a support
request, and PR #5734 keeps a ref alive regardless. Until that is done, treat the data as exposed.
