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

## Examples: what a Module looks like (illustrative — not built)

The unified shape — all three phases in one declaration; `register` is static (compose-time), `setup`/`afterSetup` are per-request and receive a `ctx` the kernel hands them:

```ts
export const CommentsModule = createModule({
    name: "Comments",
    register(container) {                 // phase 1 — immediate DI wiring (= today's Feature.register)
        container.register(CommentsRepository);
    },
    async setup(ctx) {                    // phase 2 — per-request, tenant known (via ctx, no injection)
        const model = await ctx.container.resolve(GetModelUseCase).execute(COMMENTS_MODEL_ID);
        ctx.container.registerInstance(CommentsModel, model.value);
    }
    // no afterSetup — Comments doesn't depend on other modules' setup
});
```

CMS schema — the archetype. **One module per package** (`HeadlessCmsModule`, `FileManagerModule`, …); the phase split is *within* a module (`setup` vs `afterSetup`), the barrier is *across* modules (every module's `setup` before any module's `afterSetup`). So the cooperation is between *different packages*, not a within-CMS split:

```ts
// Another package contributes its model in its own setup.
export const FileManagerModule = createModule({
    name: "FileManager",
    async setup(ctx) {
        ctx.container.registerInstance(CmsModels, await loadFileModel(ctx.container, ctx.tenant));
    }
});

// HeadlessCms loads its own models in setup, and builds the schema from EVERYONE's models in
// afterSetup — guaranteed to see FileManager's (and every other module's) models, because their
// setup already ran.
export const HeadlessCmsModule = createModule({
    name: "HeadlessCms",
    async setup(ctx) {
        for (const m of await loadCmsModelsForTenant(ctx.container, ctx.tenant)) {
            ctx.container.registerInstance(CmsModels, m);
        }
    },
    async afterSetup(ctx) {
        ctx.container.registerInstance(CmsSchema, buildGraphQLSchema(ctx.container.resolveAll(CmsModels)));
    }
});
```

The schema module's `afterSetup` is phase-3 precisely because it depends on *other* modules' `setup`. One module per package (`ApiCoreModule`, `HeadlessCmsModule`, `FileManagerModule`, …) — no registration-order comments, no `initialized` flags.

api-core impact — `AcoInitializer` today injects `Container` + `IdentityContext` and hand-wraps `withoutAuthorization`; as a Module it reads `ctx.tenant` / `ctx.featureFlags`, injects nothing infra, and the phase runner runs the whole bootstrap unauthorized:

```ts
export const AcoModule = createModule({
    name: "Aco",
    register(container) { /* DI wiring */ },
    async setup(ctx) {
        const folderModel = await ctx.container.resolve(GetModelUseCase).execute(FOLDER_MODEL_ID);
        ctx.container.registerInstance(FolderModelAbstraction, folderModel.value);
        if (ctx.featureFlags.isEnabled("advancedAccessControlLayer.folderLevelPermissions")) {
            CmsFlpFeature.register(ctx.container);
        }
    }
});
```

**`ctx` is the infra→feature interface:** `{ container, tenant, featureFlags, ... }`, supplied by the kernel. Features stop reaching for `Container`/`TenantContext`/`IdentityContext` — they declare *what* runs in *which* phase; infra owns the lifecycle, api-core owns the domain work. (Layering split: mechanism-in-infra, tenant-resolution-in-app, tenant-handed-to-features-via-ctx.)

## Unified: `Module` subsumes `createFeature` (Adrian's lean)

`createModule` is the **one** feature abstraction; a feature fills only the phases it needs:

- **Register-only features** (the majority, e.g. `ApiCoreFeature`) → `createModule({ register })` — literally `createFeature` renamed.
- **Features with per-request work** → add `setup` / `afterSetup`. A feature's `Feature` + its `RequestContextInitializer` **collapse into one module** — e.g. `AcoFeature` (register) + `AcoInitializer` (RequestContextInitializer) → one `AcoModule` with `register` + `setup`.

So there aren't two abstractions ("is this a Feature or a Module?") — there's `Module`, with named phases.

### `RequestContextInitializer` is removed

It *becomes* the `setup` phase. Deleted: the `RequestContextInitializer` abstraction, the `runRequestContextInitializers` runner, the `HttpRouter` `RequestContextInitializerDecorator`, and the 4 manual firing calls (bg-task ×2, scheduler ×2). Replaced by `runModules`, fired once post-`establish()`. The 4 impls migrate to `Module.setup`. The "Request*" naming smell is gone — only `Module` + phases remain.

Migration surface: **every** `createFeature` → `createModule` (mechanical for register-only), plus the 4 initializer merges. Big but single-model. Worth Pavel's nod (it's his `Module` vision).

## What's happening now vs deferred

- **Now (Slice-1):** fire-on-`establish()` + remove the `HttpRouter` decorator & the 4 manual calls (double-fire fix + centralization). Keeps the `RequestContextInitializer` name.
- **Deferred to `Module` design:** the rename, the 3rd phase (`after-setup`), the `withoutAuthorization` hoist. These should be decided together once the `Module` contract is agreed.
