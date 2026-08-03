# Plan: DI-native handler + licensing via feature flags

> Source: design discussion (Adrian + Pavel). No formal PRD — this file is the agreed design.
> Related: [[project_register_time_wcp_gate_bug]], [[project_request_lifecycle_di]], [[project_api_infra_layer]], [[reference_container_capture_root_vs_request]]. Tag every PR `evh-cleanups`.

## Goal

Two intertwined refactors:

- **B (handler):** turn the event handler into a DI-native app with decoratable lifecycle seams. Kill the `RequestInitializer` bag.
- **A (licensing):** remove WCP from all `api-*` packages. `api-*` read only `FeatureFlags`. The live WCP license is merged into `FeatureFlags` **before** the per-request register phase, so register-time gating (`if (flags.isXEnabled()) register(...)`) is valid again.

B ships first (Adrian wants the DI-native handler in action), and its `ChildContainerFactory` seam is where A's license-refresh decorator lands.

---

## Architectural decisions

Durable across all phases:

- **License = ceiling, flags pull down.** `final = license ∧ userFlag`. A user flag can DISABLE a licensed WCP feature (e.g. threat detection off in an infra-heavy env) but cannot enable an unlicensed one. Already coded in `applyLicense` / `applyLicenseFlag`.
- **`FeatureFlags` (api-core) is the single read surface** for `api-*`. Zero WCP imports in `api-*` after migration. `FeatureFlags.get()` stays **sync**.
- **License refresh runs PRE-register** — moved off the post-register `RequestInitializer` loop. This is the enabling change; it is exactly what #5523 lacked (refresh ran after register → `NullLicense` at register → gate always false).
- **`WcpLicenseProvider` = ROOT singleton, single-flight.** Root so concurrent child requests share it (dedup concurrent WCP calls) and so it exists before the per-request register phase. Single-flight = memoized in-flight promise; TTL cache (5 min) handles steady state, the promise closes the concurrent-expiry race.
- **Register-time gating restored.** The clean `if (flags.isPrivateFilesEnabled()) { register... }` shape returns; #5523's runtime pass-through guards are reverted.
- **Custom (non-WCP) flags — PARKED.** Today `IFeatureFlagsDto` + `FeatureFlags` accessors are a fixed WCP enum. A generic `isEnabled(key)` + open `custom` slot is deferred until needed.
- **Handler abstractions (new):** `HandlerApp` (app-level orchestrator — note `EventHandler`/`IEventHandler` is already the per-event *chain* handler, distinct), `RootContainerFactory`, `ChildContainerFactory`. Factories own container *creation* (so a decorator wraps make+populate). They live in an **app container** built in `createHandler` (3 containers total: app + root + child).

---

## [ ] Phase 1: DI-native handler app (behavior-preserving)

**Goal:** replace the `createHandler` closure with a DI-native app: `HandlerApp` + `RootContainerFactory` + `ChildContainerFactory`, all decoratable. No behavior change.

### What to build

- An **app container** built inside `createHandler` (event-handler-core). Register defaults: `HandlerApp`, `RootContainerFactory`, `ChildContainerFactory`. Let callers decorate before first use.
- `createHandler` becomes thin: build app container → register defaults → `resolve(HandlerApp)` → return `(...rawArgs) => runtime.handle(rawArgs)`.
- `RootContainerFactory.get(): Container` — lazy-once root build (honors the prebuilt-`rootContainer` path the Node server uses for eager WS-upgrade wiring). Decoratable.
- `ChildContainerFactory.create(root, rawArgs): Container` — owns: `createChildContainer()` + `registerInstance(RequestContainer, child)` + `transport.bind(child, ...rawArgs)` + `options.request(child)` + (for now) the `RequestInitializer` loop. Decoratable.
- `HandlerApp.handle(rawArgs)` — orchestrates: `root = rootContainerFactory.get()`; `child = childContainerFactory.create(root, rawArgs)`; event-type match; `executeChain`. Decoratable.
- `RequestInitializer` loop stays (relocated inside `create`) — dies in Phase 3.

### Acceptance criteria

- [ ] `createHandler` builds an app container and resolves `HandlerApp`; the returned invocable behaves identically to today.
- [ ] AWS (`createLambdaHandler`/`createWebinyApiHandler`) and Node server handlers work unchanged (root/request/transport wiring intact, incl. prebuilt-root path).
- [ ] All existing event-handler-core tests pass (chain, EventType, RequestInitializer, TestHttpEventHandler).
- [ ] A test decorates `ChildContainerFactory` and observes the decorator running per request (proves the seam).
- [ ] `RequestInitializer` semantics unchanged (still runs before dispatch, after register).

---

## [ ] Phase 2: Decisions (blocks correctness of Phase 3+)

**Goal:** resolve the two open questions that change Phase 3 wiring.

### What to build

Decisions only, recorded in this file:

1. **Build-time `project/GetFeatureFlagsWithLicense`** (bakes `WCP_PROJECT_LICENSE` env into BuildParams) now conflicts with the live runtime refresh — it would bake a stale license. Decide: BuildParams carries **user flags only**; runtime applies the license. Confirm whether the build-time merge is still needed for any consumer (CLI/admin scaffold) or is removed.
2. **`wcp` gql query (`WcpSchemaFactory` in `ApiCoreFeature`)** — admin reads it. Decide: keep and re-back it by the merged `FeatureFlags`, or admin reads flags via its own path (admin already receives merged features via gql at init).

### Acceptance criteria

- [ ] Decision 1 recorded; follow-up scoped (remove or retarget `GetFeatureFlagsWithLicense`).
- [ ] Decision 2 recorded; `wcp` query fate scoped.

---

## [ ] Phase 3: Licensing tracer bullet (private files, end-to-end)

**Goal:** prove the whole chain with one call site. This fixes the #5523 root cause.

### What to build

- New `licensing` behavior (still inside api-core for now, extracted in Phase 6):
  - `WcpLicenseProvider` → ROOT singleton + single-flight (`inflight` promise + TTL cache).
  - License refresh becomes a **decorator on `ChildContainerFactory`** (from Phase 1): `await provider.refresh()` then delegate to `create()`. Runs pre-register; provider is child-independent so no split needed.
- `FeatureFlags` becomes the merge point: relocate `WcpContextWithFeatureFlagsDecorator`'s merge to decorate **`FeatureFlags`** (user flags ∧ live license). `get()` stays sync (refresh already awaited).
- Migrate **one** call site — private files (`AssetDeliveryFeature`): `WcpContext.canUsePrivateFiles()` → `FeatureFlags.get().isPrivateFilesEnabled()`. **Revert** #5523's runtime guard in `PrivateFilesAssetProcessor` (drop injected `WcpContext` + passthrough).
- Remove the WCP-refresh `RequestInitializer`; **`RequestInitializer` can now be deleted** (last member gone — verify no other members remain from Phase 1's inventory).

### Acceptance criteria

- [ ] Deploy-verify: licensed → private files works; flag off → public delivery only; register-time gate sees live license.
- [ ] License change (upgrade/downgrade) takes effect on the **next request** within the 5-min TTL, no redeploy.
- [ ] Two concurrent requests on a cold cache trigger exactly **one** WCP call (single-flight).
- [ ] `grep WcpContext packages/api-file-manager` → zero hits in the private-files path.
- [ ] `RequestInitializer` deleted (or its remaining non-WCP members converted).

---

## [ ] Phase 4: Fan out call-site migration (mechanical)

**Goal:** migrate every remaining `WcpContext` reader to `FeatureFlags`.

### What to build

- Inventory first: `grep` for `resolve(WcpContext)` + `canUse*(` across `api-*` and `packages/*`.
- Per site: `WcpContext.canUseX()` → `FeatureFlags.get().isXEnabled()`. Revert any #5523-style runtime guard back to a register-time gate.
- Known sites: fm-s3 threat detection (`CreateFileWithThreatScanDecorator` → drop dep, re-gate in `FileManagerS3Feature`), audit-logs, aco, record-locking, workflows, ai-powerups (already trigger-time gated — align to flags).

### Acceptance criteria

- [ ] Every `WcpContext.canUse*()` call site reads `FeatureFlags` instead.
- [ ] All #5523 runtime guards reverted to register-time gates where the shape allows.
- [ ] Package builds green; existing tests pass.

---

## [ ] Phase 5: Delete WcpContext machinery

**Goal:** remove the dead request-time WCP path from api-core.

### What to build

- Confirm zero `WcpContext` readers remain.
- Delete: `WcpContext` + decorators (incl. `WcpContextWithFeatureFlagsDecorator` if its merge fully moved to `FeatureFlags`), `WcpFeature`, the old post-register `WcpLicenseInitializer`.

### Acceptance criteria

- [ ] `grep WcpContext packages/api-*` → zero hits.
- [ ] api-core builds without the WCP request-time path; tests pass.

---

## [ ] Phase 6: Extract `licensing` package

**Goal:** move WCP loading + license merge out of api-core into a dedicated `licensing` package.

### What to build

- New `@webiny/licensing` (name TBD): `WcpLicenseProvider` (single-flight), `loadWcpLicense`, the `FeatureFlags` license-merge decorator, the `ChildContainerFactory` refresh decorator.
- api-core keeps only the `FeatureFlags` abstraction (contract) + its BuildParams-backed default. `licensing` supplies the license-merge decorator and is wired by the composition/`api-infra` layer.
- `api-*` depend on zero WCP.

### Acceptance criteria

- [ ] `@webiny/wcp` referenced only by `licensing` (and CLI/build side), not by any `api-*` runtime package.
- [ ] `licensing` wires the refresh decorator onto `ChildContainerFactory` at the composition root.
- [ ] Full build + tests green; `yarn verify-dependencies` passes.
