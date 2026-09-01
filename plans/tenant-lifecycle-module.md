# Per-request lifecycle: feature phases

> Design settled between Adrian and Pavel (call, 2026-09). This note records the agreed shape and
> what remains. Context: Pavel's Slack notes (2026-08-01→03) + the `RequestContextInitializer`
> analysis.

## The problem today

Per-request post-auth setup runs through **one** hook: `RequestContextInitializer` (`init(ctx)`, fired after tenant/identity established). It's overloaded and the surrounding machinery is fragile:

1. **One phase, two needs.** A feature needs *two* kinds of post-auth work: (a) its own self-contained setup, and (b) work that depends on **other features'** setup. With a single phase, (b) runs too early — e.g. **bulk actions + background tasks** resolve their dependency graph before every feature's models/use-cases are registered, and break.
2. **Definition ⨉ dependency-graph in one class.** A feature is often one class holding both its definition *and* its constructor deps. Resolving it (just to read 2-3 strings for a GQL schema) forces the whole dep graph to resolve — sometimes before those deps exist.
3. **Ordering is implicit.** `registerApiRequestStack` relies on hand-maintained registration order (comment-enforced) + per-impl `initialized` flags.
4. **Firing is scattered + double-fires.** `runRequestContextInitializers` is called at 5 sites (HTTP `HttpRouter` decorator + 4 manual: bg-task aws/server, scheduler run/recover). On the server, body-tenant routes (bg-task/scheduler) pass through the `HttpRouter` decorator (fires pre-route, **no tenant yet**) *and* re-fire in-handler (post-tenant) → double-fire + `initialized`-flag poisoning. **(Verified.)**

## The agreed shape: phases on `createFeature`

**No new authoring API.** `createFeature` gains two optional callbacks. A feature that doesn't need them is untouched — all ~1543 existing call sites keep working unchanged.

```ts
export const AcoFeature = createFeature({
    name: "Aco",
    register(container) { /* phase 1 — immediate DI wiring, unchanged */ },
    async setup(ctx) { /* phase 2 — per-request, tenant known */ },
    async afterSetup(ctx) { /* phase 3 — depends on OTHER features' setup */ }
});
```

| Phase | When | For | ≈ today |
|---|---|---|---|
| **register** | immediate, sync, no resolution | "what exists" — DI wiring | `Feature.register()` |
| **setup** | per-request, post-tenant | a feature's own self-contained setup | `RequestContextInitializer` |
| **afterSetup** | per-request, after **all** `setup` | work depending on *other* features' setup | *(missing — bulk actions/bg-tasks belong here)* |

`afterSetup` is the missing phase: it runs only once every feature's `setup` has completed, so cross-feature deps are guaranteed present.

### Why not `createModule`

A second authoring API would mean two front doors ("feature or module?"), a mixed registration list, and — since the honest answer would be "module, always" — a 1543-site rename. It only earns its keep if `Module` means *more* than phases (declaring scope, or separating definition from dependency-graph resolution). Phases are the whole change, so `createFeature` wins. `Module` as a developer-facing concept is dropped.

### How the phases are found: the carrier

`createFeature`'s generated `register()` stashes the callbacks in the container under an internal token, `FeatureLifecycle`:

```ts
register(container, context) {
    def.register(container, context);
    if (def.setup || def.afterSetup) {
        container.registerInstance(FeatureLifecycle, { name, setup, afterSetup });
    }
}
```

This is **plumbing, not a concept** — no feature author imports `FeatureLifecycle`. It buys two things a static walk over `registerApiRequestStack`'s list cannot:

- **Uniformity.** Nested features get `register(container)` with the *same* container as their parent, so a feature at **any depth** works. A static list-walk would silently no-op for the (majority) nested call sites — an undetectable footgun across 1543 usages.
- **Gating for free.** A feature gated behind a license check never registers, so it never contributes phases. No `enabled` predicate needed; today's early-return pattern keeps working:

```ts
// WorkflowsFeature — unchanged
register(container) {
    if (!...isEnabled("advancedPublishingWorkflow")) return;
    WorkflowsInnerFeature.register(container);   // ← owns setup(); never registered when gated
}
```

### `ctx` is the infra→feature interface

`RequestContext` = `{ container, tenant, featureFlags, identity, ... }`, supplied by the runner. Features stop reaching for `Container`/`TenantContext`/`IdentityContext` — they declare *what* runs in *which* phase; infra owns the lifecycle. The type stays open in `@webiny/feature` (a base primitive that must not depend on `@webiny/api-core` types); the api layer narrows it.

The runner wraps the whole pass in `withoutAuthorization` once, so features stop hand-wrapping it.

## Who executes the phases

| Phase | Executed by | When |
|---|---|---|
| **register** | `registerApiRequestStack` calls each `Feature.register()` | eager, at child-container build — **today, unchanged** |
| **setup / afterSetup** | `runFeaturePhases(container, { context, continueOnError })` | once per request, **post-tenant**, before dispatch |

`runFeaturePhases` lives in **`api-event-handler-core`**, next to the feature list it serves. `event-handler-core` (the transport-agnostic kernel) is not involved — the mechanism is a two-pass loop, and the phases are an api-layer concern.

**Error mode stays per-path.** HTTP fails fast (a broken `setup` is a 500); background tasks and scheduled actions pass `continueOnError: true`. The caller passes its own policy, so no behaviour flattens.

**Trigger placement — open.** There is no single moment the kernel knows the tenant: HTTP takes it from the `x-tenant` header via a loader decorator, while bg-task and scheduler routes read it from the body *inside* the handler. Options:

- **(a) hook `RequestTenantLoader.establish()`** — the one call every path makes. **Blocked:** ~20 test harnesses set tenant via `setTenant`/header and never call `establish()`, so they'd silently stop running phases.
- **(b) keep per-transport firing**, collapsing 5 sites → 2 (HTTP decorator + one shared helper for the body-tenant routes). Unblocked, less elegant. **Current lean.**
- **(c)** fire lazily on first resolve of something tenant-dependent. Too magic.

## `RequestContextInitializer` is removed

It *becomes* the `setup` phase. Deleted at the end of the migration: the `RequestContextInitializer` abstraction, the `runRequestContextInitializers` runner, the `HttpRouter` `RequestContextInitializerDecorator`, and the 4 manual firing calls (bg-task ×2, scheduler ×2). The "Request*" naming smell goes with it.

The 4 impls fold into their parent feature — each is already registered from inside one:

| Initializer | Folds into |
|---|---|
| `AcoInitializer` | `AcoFeature.setup` |
| `WorkflowsInitializer` | `WorkflowsFeature` (inner, gated) |
| `FileModelContextualSchema` | `FileManagerAppFeature.setup` |
| `SchedulerModelContextualSchema` | `SchedulerFeature.setup` |

Each merge drops an `initialized` flag, a `constructor(container)`, and its hand-rolled `withoutAuthorization` wrapper.

**`RequestInitializer` (pre-auth) is already gone** — it had zero implementations after the WCP license load moved to a pre-register eager load. Removed separately (#5623). So `setup`/`afterSetup` is the *whole* per-request lifecycle, not a third hook alongside two others.

## Status

**Step 1 — done (this branch).** Fully additive, nothing fires yet:

- `FeatureLifecycle` token + `RequestContext` / `FeaturePhases` types in `@webiny/feature`
- `createFeature` accepts optional `setup` / `afterSetup` and stashes them
- `runFeaturePhases` in `api-event-handler-core` (phase barrier, `continueOnError`, `context`)
- 14 tests across the two packages; api-core's 171 green (backward compatible)

**Next**, in order:

1. Decide trigger placement (option b above), wire `runFeaturePhases`, remove the `HttpRouter` decorator + 4 manual calls → fixes the double-fire.
2. Migrate the 4 initializers, one PR at a time. During transition the runner can also run legacy `RequestContextInitializer`s so nothing is stranded.
3. Hoist `withoutAuthorization` into the runner.
4. Delete `RequestContextInitializer` and its machinery.
5. Un-comment bulk actions (`HcmsBulkActionsFeature`) into `afterSetup` — the case that motivated the third phase.
