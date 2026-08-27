# Per-request lifecycle: phases + the `Module` concept

> Design note for discussion (Adrian + Pavel). Not a plan to code yet — a shared artifact to react to.
> Context: Pavel's Slack notes (2026-08-01→03) + the `RequestContextInitializer` analysis.

## The problem today

Per-request post-auth setup runs through **one** hook: `RequestContextInitializer` (`init(ctx)`, fired after tenant/identity established). It's overloaded and the surrounding machinery is fragile:

1. **One phase, two needs.** A feature needs *two* kinds of post-auth work: (a) its own self-contained setup, and (b) work that depends on **other features'** setup. With a single phase, (b) runs too early — e.g. **bulk actions + background tasks** resolve their dependency graph before every feature's models/use-cases are registered, and break.
2. **Definition ⨉ dependency-graph in one class.** A feature is often one class holding both its definition *and* its constructor deps. Resolving it (just to read 2-3 strings for a GQL schema) forces the whole dep graph to resolve — sometimes before those deps exist.
3. **Ordering is implicit.** `registerApiRequestStack` relies on hand-maintained registration order (comment-enforced) + per-impl `initialized` flags.
4. **Firing is scattered + double-fires.** `runRequestContextInitializers` is called at 5 sites (HTTP `HttpRouter` decorator + 4 manual: bg-task aws/server, scheduler run/recover). On the server, body-tenant routes (bg-task/scheduler) pass through the `HttpRouter` decorator (fires pre-route, **no tenant yet**) *and* re-fire in-handler (post-tenant) → double-fire + `initialized`-flag poisoning. **(Verified.)**

## The `Module` concept (Pavel, WIP)

A feature declares its pieces and **which phase** each runs in; the framework runs **all Modules' phase-N before any Module's phase-N+1**. So a developer says *when* (and possibly *where/scope*) each piece registers, instead of relying on order + lazy resolution.

### Proposed phases

| Phase | When | For | ≈ today |
|---|---|---|---|
| **register** | immediate, sync, no resolution | "what exists" — DI wiring | `Feature.register()` |
| **setup** | per-request, post-tenant | a feature's own self-contained setup | `RequestContextInitializer` |
| **after-setup** | per-request, after all `setup` | work depending on *other* features' setup | *(missing — bulk actions/bg-tasks belong here)* |

`after-setup` is the missing phase: its work resolves only once every feature's `setup` has run, so cross-feature deps are guaranteed present.

## How it composes with the firing work (Slice-1, being done now)

- **Trigger + timing = `RequestTenantLoader.establish()`.** Every path (HTTP loader decorator, bg-task aws+server, scheduler run+recover) calls `establish()`. Firing the per-request phases there = one fire per request, post-tenant → **kills the double-fire** and centralizes.
- Initializers are **identity-agnostic** (all run inside `identityContext.withoutAuthorization`), so firing pre-identity (right after tenant) is safe.
- With `Module`, that same `establish()` point runs **`setup` then `after-setup`** instead of one undifferentiated pass.

So the two efforts are orthogonal: **Slice-1 fixes the trigger; `Module` defines the phase structure.**

## Open questions for Pavel

1. **Phase contract** — names + how a feature declares which phase a piece belongs to. Is it methods on a `Module` (`register` / `setup` / `afterSetup`), or declarative entries?
2. **Relationship to `createFeature`** — is `Module` a superset of the current Feature, or a new abstraction Features opt into?
3. **Scope** — does a Module piece also declare *where* (root / child / per-tenant) it registers, or only *when* (phase)?
4. **Naming** — `RequestContextInitializer` → becomes the `setup` phase of a Module? (If so, the standalone rename to `TenantFeature` is moot — the phase name wins.)
5. **Migration** — the 4 real `RequestContextInitializer` impls (AcoInitializer, WorkflowsInitializer, FileModelContextualSchema, SchedulerModelContextualSchema) + the `GraphQLContextualSchema` impls that fire on schema-build. Which move to `setup` vs `after-setup`?
6. **`withoutAuthorization`** — hoist the wrapper to the phase runner (whole bootstrap runs unauthorized, features stop injecting `IdentityContext`)? Deferred from Slice-1; fits the `Module` runner naturally.

## What's happening now vs deferred

- **Now (Slice-1):** fire-on-`establish()` + remove the `HttpRouter` decorator & the 4 manual calls (double-fire fix + centralization). Keeps the `RequestContextInitializer` name.
- **Deferred to `Module` design:** the rename, the 3rd phase (`after-setup`), the `withoutAuthorization` hoist. These should be decided together once the `Module` contract is agreed.
