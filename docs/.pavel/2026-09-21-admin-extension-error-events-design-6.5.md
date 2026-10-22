# Admin Extension Error Handling & Scoping — 6.5 Design

**Date:** 2026-09-21 (updated 2026-09-22)
**Codebase:** `release/6.5.0` (`webiny-6.5.x`)
**Companion:** `2026-09-21-admin-extension-error-events-design.md` (6.4 problem definition)
**Status:** Design — all 7 verification points investigated, findings below.

---

## Requirement (unchanged)

An extension needs to show its own validation dialog, built from `error.data.issues`, when
page publish or scheduling fails — while Webiny keeps showing its generic toast.

- Editor single publish → custom dialog
- Page list single publish → custom dialog
- Scheduling failure → custom dialog (and must NOT show a success toast)
- Bulk publish → **suppressed**; Webiny's standard results dialog owns per-item outcomes

**Discrimination axis is single-vs-batch, not editor-vs-list.**

Structured error shape that must survive to the extension:

```ts
{ message: string, code: "PUBLISH_VALIDATION_FAILED", data: { issues: [...] } }
```

---

## Settled constraints (carry-over from 6.4 — do not relitigate)

1. Use cases are the application's public API.
2. Component decoration is NOT an extension point for actions.
3. No single orchestrator in the page editor (confirmed: still true in 6.5).
4. Webiny already provides DI features and a Dialog component. "How to render" is not open.
5. Preferred mechanism: **use case decorators** + **Result pattern** + **batch marker**.

---

## 6.5 verification results

### 1. Result pattern on admin — NOT ADOPTED

Admin use cases return `Promise<void>` and throw on failure. Zero `Result.ok`/`Result.fail`
anywhere in `packages/app-*`. The API side uses `Result` (`@webiny/feature/api`); the admin
side does not. The asymmetry from 6.4 persists.

**Evidence:**
- `IPublishPageUseCase.execute()` → `Promise<void>` (abstractions.ts:10)
- `usePublishPage()` returns `{ publishPage }` which returns `Promise<void>`
- `PublishButton.tsx` — no try/catch on the publish path (line 54–66)

**Impact:** The decorator approach requires migrating admin use cases to `Result` first. A
decorator today has nothing to inspect — the operation either succeeds silently or throws.

### 2. Gateways discard structured errors — STILL BROKEN

All gateways `throw new Error(envelope.error.message)`, discarding `code` and `data`. The
GraphQL queries DO request `error { code data message }` and the response types carry all
three — but every gateway flattens to a plain `Error`.

**Publish path:**
- `PublishPageGateway.ts:42` — `throw new Error(envelope.error.message || "...")`

**Scheduler path (all 3 gateways):**
- `SchedulePublishActionGateway:73` — `throw new Error(result.error?.message || ...)`
- `CancelScheduledActionGateway:44` — same
- `GetScheduledActionGateway:61` — same

**ScheduleDialogPresenter** — three bare `catch {}` blocks (lines 68, 94, 112) swallow errors
from `load`, `schedule`, and `cancel`. A failed schedule silently sets `loading = false`
without surfacing any error. **The "success toast on failure" bug from 6.4 is still present.**

**No admin-side typed error class.** `@webiny/error` (`WebinyError`) exists but is imported
only on the API side. `packages/app/src/errors/` has `AuthenticationErrorEvent` and
`NetworkErrorEvent` — event-infrastructure classes for the GraphQL client decorator, not
general-purpose error types.

### 3. Bulk actions — NO APP-LEVEL BATCH in WB

**Worker / processInSeries** — still present in `packages/app-admin/src/components/BulkActions/Worker.ts`.
A new `BulkActionRunner<T>` wraps `Worker` and adds an `allSelected` routing: if
`allSelected && handlers.onBulk`, delegates to `onBulk`; otherwise falls through to
`processInSeries`.

**Website-builder:** All WB bulk presenters hard-code `runner.run(items, false, { onItem })` —
`allSelected` is never true, so `onBulk` is never reached. There is no `BulkActionUseCase` in
WB. Every WB bulk operation is a client-side loop calling the single-item use case.

**CMS has dual-path parity:** CMS's `BulkPublishPresenter` passes both `onItem` and `onBulk`,
backed by a proper `BulkActionUseCase` (DI-registered, decoratable) and `BulkActionRepository`.
The gap from 6.4 persists: **WB has no equivalent.**

**Error handling in bulk: worse than 6.4.** Neither WB's nor CMS's bulk presenters have
try/catch around the per-item call. If the use case throws, errors propagate unhandled through
Worker → BulkActionRunner → presenter → dialog callback. `Report.error()` exists but is never
called for exceptions. In 6.4 errors were at least caught and flattened to `e.message`; in 6.5
they escape entirely.

**Implication:** A decorator on `PublishPageUseCase` fires identically for single and bulk
because WB's bulk is a client-side loop calling the same use case. The `BulkActionRunner` is a
presentation-layer concept, so a use-case decorator cannot distinguish the two. A batch marker
or context is still needed.

### 4. DI container — UNCHANGED (`@webiny/di@1.0.2`)

```js
collectDecorators(token) {
    const parentDecorators = this.parent ? this.parent.collectDecorators(token) : [];
    const own = this.decorators.get(token) || [];
    return [...parentDecorators, ...own];
}
```

Child containers can add decorators but **cannot exclude** a parent's. No `removeDecorator`,
`overrideDecorator`, or exclusion API. `createChildContainer()` simply sets `child.parent = this`.

`resolveFrom` threading unchanged — parent-found registrations resolve dependencies from the
child that started resolution.

**New wrapping layer:** `@webiny/feature` provides `createFeature()`, `BaseError`, and
`createAbstraction` as higher-level helpers on top of `@webiny/di`. The DI core is untouched.

**Container scoping as a suppression mechanism remains blocked.**

### 5. Page editor — NO ORCHESTRATOR, 4 PUBLISH SITES

| # | Call site | Error handling |
|---|-----------|---------------|
| 1 | Editor TopBar `PublishButton.tsx:59` | No try/catch; success toast assumed |
| 2 | Page list `usePublishPageConfirmationDialog.tsx:71` | try/catch, but catches `ex.message` only — structured data lost |
| 3 | Revision history `useRevision.tsx:40` | No try/catch, no toast (fire-and-forget) |
| 4 | Bulk publish `BulkPublishPresenter.ts:25` | No try/catch; failures crash the runner |

No `PageEditorPresenter`. The editor remains a composition of independent components.

### 6. Container topology — NO SUBTREE SCOPING FOR EDITOR

`DocumentEditor.tsx` wraps children in `DocumentEditorContext` (plain React context) and
`DialogsProvider`, but does NOT create a DI child container. The editor resolves features from
whatever container its parent provides.

**Scoped container sites in WB (6.5):**
- `PagesList.tsx` — child container for page list + bulk action features
- `RedirectsList.tsx` — child container for redirect features

**No subtree-targeted extension registration.** `AdminExtension` is build-time code injection
into a top-level `Extensions.tsx` fragment. Extensions register globally. There is no public
API for an extension to register into a specific DI subtree.

### 7. Event infrastructure — SAME SHAPE, CMS ADOPTING

`packages/app/src/features/eventPublisher/` still present. `BaseEvent<TPayload>`,
`IEventHandler<TEvent>`, `IEventPublisher` unchanged. `publish()` still awaits handlers
serially (`for...of` + `await handle()`).

**New in 6.5 (CMS only):** `EntryAfterCreateEvent`, `EntryAfterUpdateEvent`,
`EntryAfterDeleteEvent` published from CMS repositories. Shows the pattern is being adopted
for CRUD — but no publish/unpublish events, no failure events. Website-builder publishes
**zero** admin-side events.

`AuthenticationErrorPublishing` / `NetworkErrorPublishing` still present as GraphQL client
decorators — unchanged from 6.4.

---

## 6.4 problems vs 6.5: scorecard

| Problem | Still exists in 6.5? | Notes |
|---------|---------------------|-------|
| Gateways discard structured errors | **Yes** | All 4 gateways, identical code |
| Admin use cases throw instead of Result | **Yes** | Zero `Result` usage in `app-*` |
| Scheduler swallows errors (bare `catch {}`) | **Yes** | 3 bare catches in `ScheduleDialogPresenter` |
| Bulk indistinguishable from single | **Yes** | WB has no app-level batch |
| Child container cannot exclude parent decorators | **Yes** | `@webiny/di@1.0.2` unchanged |
| No publish failure events | **Yes** | WB has zero events |
| PublishButton has no try/catch | **Yes** | Lines 54–66 |
| Bulk error handling broken | **Worse** | 6.4 caught and flattened; 6.5 doesn't catch at all |

---

## Design: prerequisites (no design questions — just work)

### P1. Typed gateway errors

Every admin gateway that today does `throw new Error(message)` must throw a typed error
carrying `message`, `code`, and `data`.

`@webiny/feature` already exports `BaseError`. Gateways should throw `BaseError` (or a
subclass) built from the GraphQL error envelope. This is purely mechanical — the GraphQL
queries already request all three fields, and the response types already declare them.

**Scope:** 4 gateway files (1 publish + 3 scheduler).

### P2. Result pattern on admin use cases

Admin use cases must return `Result` so decorators can inspect outcomes.

**Decision (matching 6.4 lean):** Gateways still throw. Use cases wrap in try/catch, convert
to `Result.fail(error)` / `Result.ok(data)`. React hooks return `Result`.

The API side already does this via `@webiny/feature/api`. The admin side needs the same from
`@webiny/feature` (or `@webiny/feature/admin` — verify where `Result` is currently exported).

**Scope:** `PublishPageUseCase` + all scheduler use cases. Migration is per-use-case, not
all-at-once.

### P3. Fix ScheduleDialogPresenter error swallowing

Replace 3 bare `catch {}` blocks with proper error surfacing. Once P2 is done, the presenter
receives `Result` and can check `result.isFailure`. Until then, at minimum: catch, log, and
surface the error to the view so the success toast is suppressed on failure.

### P4. Fix publish call sites

All 4 publish call sites need try/catch (or, post-P2, `Result` checking). At minimum:
- `PublishButton.tsx:59` — add try/catch, show error toast
- `useRevision.tsx:40` — add try/catch, show error toast
- `BulkPublishPresenter.ts:25` — add try/catch, report to `Report.error()`

---

## Design: the extension mechanism

### Mechanism: use case decorator (confirmed)

The 6.4 analysis preferred decorators over events. 6.5 evidence confirms this:

**Why decorator, not event:**
- A decorator is on the call path — handler-isolation question disappears.
- Ordering is explicit via registration order.
- No new event class / handler abstraction / uniform-events decision needed.
- CMS's adoption of events is for after-CRUD broadcast (audit, cache), which is the right
  use — but the customer's requirement is "react to THIS operation's failure," not "observe
  all failures."

**What the extension does (once P1+P2 are in):**

```ts
// In the extension's AdminExtension registration
container.registerDecorator(
  createDecorator({
    abstraction: PublishPageUseCase,
    decorator: (original) => ({
      async execute(params) {
        const result = await original.execute(params);
        if (result.isFailure && result.error.code === "PUBLISH_VALIDATION_FAILED") {
          validationDialogState.open(result.error.data.issues);
        }
        return result;
      }
    })
  })
);
```

The extension owns its own MobX state (`validationDialogState`) and a React component that
observes it — both already-supported patterns, not new Webiny API.

### Batch discrimination: batch context on the use case

A decorator on `PublishPageUseCase` fires identically for single and bulk because WB's bulk
is a client-side loop calling the same use case. The decorator needs to know "am I in a batch?"

**Rejected:** `origin` parameter (wrong axis), container scoping (additive-only, blocked).

**Chosen: `ExecutionContext` carried through use case calls.**

The `BulkActionRunner` (or the hook that drives it) sets a batch context before the loop:

```ts
interface IExecutionContext {
  batch?: { id: string; size: number };
}
```

This is passed as a second argument to `execute`, or via a context provider:

**Option A — explicit parameter:**
```ts
// Use case signature
execute(params: { id: string }, context?: IExecutionContext): Promise<Result<Page>>

// BulkActionRunner sets it
const batchContext = { batch: { id: uuid(), size: items.length } };
for (const item of items) {
  await useCase.execute({ id: item.id }, batchContext);
}

// Extension decorator checks it
if (!context?.batch && result.isFailure && result.error.code === "PUBLISH_VALIDATION_FAILED") {
  validationDialogState.open(result.error.data.issues);
}
```

**Option B — ambient context (DI-scoped):**
A `BatchContext` abstraction registered in DI. The runner sets it before the loop; decorators
read it. Avoids changing every use case signature, but introduces ambient state.

**Recommendation: Option A (explicit parameter).** It's more honest — the context is data
that flows with the call, not ambient state. It makes signatures load-bearing, which is
consistent with "use cases are the public API." A use case that doesn't need batch
discrimination ignores the second argument.

**Why this is defensible where `origin` was not:**
- It describes an application-level fact ("one of N in a batch"), not a UI fact.
- Bounded value space (batch or not) — doesn't drift as call sites multiply.
- The system already draws this line (CMS's `isSelectedAll` split). The marker makes an
  existing implicit distinction explicit.

---

## Public API surface Webiny commits to

For extensions to implement the customer's requirement, Webiny must make these public:

1. **`Result<T, E>` on admin use cases** — `execute()` returns `Result`, hooks return `Result`.
2. **`BaseError` (or subclass) from gateways** — carrying `message`, `code`, `data`.
3. **`IExecutionContext`** — the batch marker shape, as a stable interface.
4. **Use case abstractions** (`PublishPageUseCase`, scheduler use cases) — already public via
   DI, but their return type changing from `void` to `Result` is a breaking change for existing
   decorators. Needs a migration note.
5. **`createDecorator`** — already public via `@webiny/feature/admin`.

**Not committing to:**
- A Webiny-provided error dialog framework. Extensions bring their own UI.
- Container subtree targeting. Extensions register globally and discriminate via context.
- Uniform events on all use cases. Demand-driven — events are for broadcast, not for
  this use case.

---

## Scope of work (ordered)

| # | Work item | Package(s) | Breaking? |
|---|-----------|-----------|-----------|
| P1 | Gateway typed errors (throw `BaseError` with code+data) | app-website-builder, app-scheduler | No |
| P2 | `Result` on publish + scheduler use cases | app-website-builder, app-scheduler, feature | Yes (return type) |
| P3 | Fix `ScheduleDialogPresenter` error swallowing | app-scheduler | No |
| P4 | Fix 4 publish call sites (try/catch or Result checking) | app-website-builder | No |
| P5 | `IExecutionContext` + batch marker on `BulkActionRunner` | app-admin, app-website-builder | Yes (signature) |
| P6 | Documentation: decorator pattern for extension error handling | docs | No |

**P1 → P2 → P3/P4 (parallel) → P5 → P6**

P1 and P2 are load-bearing prerequisites. P3/P4 are independent bug fixes that become
trivial once P2 lands. P5 is the batch discrimination layer. P6 documents the extension
pattern.

---

## Open decisions (for product/architecture review)

1. **`Result` migration scope:** Just publish + scheduler, or all admin use cases? Lean:
   start with the customer-facing path, expand demand-driven.
2. **`IExecutionContext` shape:** Should it carry more than batch? (e.g., `initiator` for
   audit?) Lean: start minimal, extend later — batch is the only proven need.
3. **WB `processInBulk` parity with CMS:** Should WB gain a `BulkActionUseCase` backed by
   a server-side bulk mutation? Separate from this requirement but same underlying gap.
   Not blocking this work.
4. **Breaking change strategy for `void` → `Result`:** Existing decorators that don't return
   a value will break. Options: deprecation period with runtime coercion, or clean break
   in 6.5 (since it's a major feature release).

---

## Not doing

- **Component decoration as an action extension point.** Settled in 6.4, confirmed in 6.5.
- **`origin`-style presentation discriminator.** Wrong axis.
- **A second presentation-level error event.** If it carries enough context to be actionable,
  the application event carries strictly less.
- **Global error store / error dialog framework.** Extensions bring their own UI via existing
  DI + Dialog patterns.
- **Container subtree exclusion in `@webiny/di`.** Not needed for this requirement and the
  DI core is unchanged. Changing `collectDecorators` is a separate, larger discussion.
