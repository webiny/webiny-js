# Self-Cleaning Tasks — Design

**Date:** 2026-04-20
**Package:** `packages/tasks`, `packages/api-core`
**Status:** Design approved, pending implementation plan

## Problem

Webiny background tasks persist both a task record (`webinyBackgroundTask` CMS model) and, when enabled, task log entries (`webinyBackgroundTaskLog`). For short-lived or high-volume tasks, these records accumulate indefinitely and offer no value after the task finishes. There is no built-in mechanism to purge them.

This spec adds an opt-in, per-definition self-cleanup configuration that deletes the task record (and any logs and descendant tasks) once the task reaches a terminal state selected by the author.

## Goals

- Let a task definition declare which terminal states trigger cleanup.
- Delete the task record, its logs, and its full descendant tree in one pass.
- Skip writing logs entirely when cleanup is enabled (in any mode) — CloudWatch and Step Functions cover debugging.
- Zero runtime cost for definitions that don't opt in.
- Reuse existing CRUD, events, and decorator patterns. No new event types, no per-invocation overrides.

## Non-Goals

- Per-invocation (`trigger`-time) override. Definition-level only.
- Retention windows / TTL. Cleanup is immediate on the terminal transition.
- Retry infrastructure for failed deletions. Failures are logged and swallowed.
- A separate `TaskCleanupFailedEvent`. Existing `TaskBefore/AfterDeleteEvent` remain the extension points.
- Backfill / purge of pre-existing records. The feature applies to future runs only.

## Public API

Field added to `ITaskDefinition` (location: `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`).

```ts
type SelfCleanupEvent = "onSuccess" | "onError" | "onAbort";

type SelfCleanup =
    | "always"
    | "never"
    | SelfCleanupEvent
    | SelfCleanupEvent[];

interface ITaskDefinition<I, O> {
    // …existing fields…
    selfCleanup?: SelfCleanup; // undefined = off
}
```

Example:

```ts
createTaskDefinition({
    id: "sendReport",
    title: "Send report",
    selfCleanup: ["onSuccess", "onError"],
    run: async params => { /* … */ }
});
```

Semantics:

| Value                                           | Meaning                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `undefined` / `"never"`                         | Cleanup disabled. `databaseLogs` honors the definition as today.      |
| Single event (`"onSuccess"`)                    | Cleanup runs only for that terminal state. `databaseLogs` forced off. |
| Array (`["onSuccess", "onError"]`)              | Cleanup runs for any matching terminal state. `databaseLogs` forced off. |
| `"always"`                                      | Cleanup runs for all terminal states. `databaseLogs` forced off.       |

`databaseLogs` rule: any `selfCleanup` value other than `undefined` / `"never"` forces `databaseLogs: false`. Writing logs that will be deleted is wasteful, and users accept the debuggability trade-off (CloudWatch + Step Functions remain).

## Architecture

Three pieces, kept independent:

1. `SelfCleaningTaskDecorator` — wraps a task definition, normalizes config, wraps lifecycle hooks, overrides `databaseLogs`.
2. `cleanupTaskSubtree(taskId)` — new CRUD helper in the tasks context, recursively deletes task + logs + descendants.
3. Abort wiring — ensures `onAbort` is invoked so cleanup fires on abort (exact wiring determined by tracing; see *Abort path*).

The decorator is the only callsite of `cleanupTaskSubtree` introduced by this spec.

## `SelfCleaningTaskDecorator`

New file: `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts`. Follows the existing `RunnableTaskDecorator` pattern (same directory) and is registered with `dependencies: [RunnableTaskDecorator]` so it wraps the already-defaulted definition.

Responsibilities:

1. **Normalization** at construction:
   - Resolve `selfCleanup` into a `ReadonlySet<SelfCleanupEvent>`.
   - `undefined` / `"never"` → empty set; `"always"` → all three; single / array → as given (duplicates collapsed).

2. **`databaseLogs` override**:
   - If the event set is non-empty, the getter returns `false` regardless of the underlying definition.

3. **Hook exposure**:
   - `onDone`, `onError`, and `onAbort` getters always return a function (never `undefined`), so `TaskControl.runEvents()` always invokes them. The inner function first invokes the decoratee's original hook (if defined) under try/catch, then checks the event set and awaits cleanup.
   - User-hook throws are caught and logged with the same pattern as `TaskControl.runEvents` (`TaskControl.ts:186-189`). Cleanup still runs — a failing `onDone` should not block a user-requested cleanup.

4. **Cleanup dispatch**:
   - Calls `cleanupTaskSubtree(task.id)`. See *Context access* below — this is the non-trivial bit.

### Context access

`ITaskLifecycleHook` today is `{ task: ITask }` only. The comment on the interface says *"receive task data, no context"* — an intentional past choice. The decorator needs access to the tasks CRUD to run cleanup, so there are three viable options:

- **A. Resolve the tasks feature from the IoC container at hook-invocation time.** The decorator's constructor receives the `container` / IoC resolver as a dependency via `TaskDefinition.createDecorator({ dependencies: [...] })`. Inside the wrapped hook it resolves the request-scoped tasks context and calls `cleanupTaskSubtree`. Keeps the public hook signature unchanged. Requires verifying the decorator is re-resolved per request, or that the resolver itself is safe to capture.
- **B. Read through `TaskExecutionContext`.** The runner populates a request-scoped `TaskExecutionContext` at `TaskControl.ts:135-139` with `store`, `runner`, `timer`, `response`. The store holds the task and its `context`. The decorator resolves `TaskExecutionContext` via the container at hook time and pulls `tasks` off it (possibly after extending the execution context with an accessor). Piggy-backs on an existing request-scoped object but leaks internal state.
- **C. Extend `ITaskLifecycleHook`** to include `context` (or a narrower `tasks` handle). Cleanest for this feature but changes the public hook signature — every existing `onDone` / `onError` user keeps working because the field is additive, but the "no context" design intent is broken.

**Recommendation: A.** Matches the IoC pattern the decorator system already uses; leaves the hook signature alone. If A turns out to be non-viable (container lifecycle mismatch), fall back to C with an explicit note that the "no context" comment is being revised.

### Sketch

```ts
class SelfCleaningTaskDecoratorImpl implements TaskDefinition.Interface {
    private events: ReadonlySet<SelfCleanupEvent>;

    constructor(
        private decoratee: TaskDefinition.Interface,
        private resolveTasks: () => ITasksContextCrudObject
    ) {
        this.events = normalizeSelfCleanup(decoratee.selfCleanup);
    }

    get databaseLogs() {
        return this.events.size > 0 ? false : this.decoratee.databaseLogs;
    }

    get onDone() {
        return async params => {
            await this.safeCall(this.decoratee.onDone, params, "onDone");
            if (this.events.has("onSuccess")) {
                await this.resolveTasks().cleanupTaskSubtree(params.task.id);
            }
        };
    }
    // onError, onAbort analogous.
}

export const SelfCleaningTaskDecorator = TaskDefinition.createDecorator({
    decorator: SelfCleaningTaskDecoratorImpl,
    dependencies: [RunnableTaskDecorator /* plus whatever wires resolveTasks */]
});
```

The `resolveTasks` lambda is illustrative — the implementation plan nails down the exact IoC wiring once the container API is confirmed.

The decorator also delegates all remaining fields (`id`, `title`, `run`, `onBeforeTrigger`, `onMaxIterations`, `createInputValidation`, etc.) to the decoratee verbatim, mirroring `RunnableTaskDecorator`.

## `cleanupTaskSubtree`

New method on `ITasksContextCrudObject` in `packages/tasks/src/crud/crud.tasks.ts`:

```ts
cleanupTaskSubtree(taskId: string): Promise<void>;
```

Algorithm:

1. **Collect descendants breadth-first** using existing `listChildTasks(parentId)`. Visit with a `Set<string>` of seen ids to short-circuit any cycle (cycles should not exist; belt-and-suspenders).
2. **Build a deletion order: leaves first, root last.** Reverse the BFS order.
3. **Delete each task.** For every task id in order:
   1. Look up the definition via `context.tasks.getDefinition(task.definitionId)`.
   2. If the definition exists and `definition.databaseLogs === true`, list and delete its logs one by one.
   3. If the definition does not exist, skip the log sweep but still delete the task row.
   4. Call the existing `deleteTask(id)`, which continues to publish `TaskBefore/AfterDeleteEvent`.
4. **Best-effort errors.** Each delete is wrapped in try/catch; failures `console.warn` the affected id and error, then iteration continues. The method never throws.

Why bottom-up: descendants are guaranteed terminal before an ancestor terminates (see *Invariants*), so ordering is cosmetic for liveness. Bottom-up keeps `parentId` pointers referentially valid until each record is itself deleted — friendly to any listener that reads the parent during `TaskBeforeDeleteEvent`.

No new event types. Consumers who want to react to cleanup can listen on the existing delete events.

## Abort Path

`TaskControl.runEvents()` (lines 177-201) currently dispatches only `onDone` and `onError`. `onAbort` is declared on `ITaskDefinition` but never called by the runner. The short-circuit at `TaskControl.ts:101` *reads* an already-set `ABORTED` status — so an earlier writer sets it.

Implementation must begin with a tracing task: find every callsite that writes `taskStatus = ABORTED`. Likely candidates:

- `packages/tasks/src/service/` — the `service.abort()` flow exposed via `ITasksContextServiceObject.abort`.
- `packages/tasks/src/features/` — any abort feature / use case.

Based on the trace, wire cleanup as follows:

- **If abort flows back through the runner** (e.g., the service signals Step Functions which re-enters `TaskControl.run()` and drives the terminal transition) → add a third branch to `runEvents()` for `TaskResultStatus.ABORTED` that calls `definition.onAbort?.(…)` with the same try/catch pattern as `onDone`/`onError`. The decorator's wrapped `onAbort` then fires cleanup.
- **If abort is written directly by a service-layer use case** (never reaches `runEvents`) → invoke `context.tasks.cleanupTaskSubtree(taskId)` from that use case after the status write, gated by the definition's resolved event set. In this case the decorator's `onAbort` wrap is redundant for this path but remains useful if any abort flow ever routes through the runner.

Either way, the public API (`selfCleanup: "onAbort"`) and `cleanupTaskSubtree` helper are unchanged.

## Invariants

The design relies on a single invariant: **a child task cannot be in a non-terminal state when its parent has already reached a terminal state.** User-confirmed. This means by the time any ancestor's cleanup runs, every descendant is terminal, so cascade deletion is safe.

Implementation must verify this invariant holds in the current runner. If it does not (e.g., parent terminal status is written before children finish), the implementation plan takes the enforcement as a dependency: either add the wait or block release of the feature. The decorator itself does not need to enforce it — it's a runner-level property.

## Error Handling

| Source                              | Behavior                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| User's `onDone` / `onError` / `onAbort` throws | Caught inside decorator, logged, cleanup still runs.                  |
| `cleanupTaskSubtree` record delete throws | Caught per-record, `console.warn`, continue with next record.             |
| `cleanupTaskSubtree` top-level throws | Not possible by design — all work is inside per-record try/catch.         |
| Missing definition on a descendant  | Skip log sweep, still delete the task row.                                   |
| Concurrent subtree mutation         | Not guarded. New records created mid-cleanup are simply not picked up.       |
| Idempotent re-invocation            | Second call on the same id is a no-op (already-deleted errors are caught).   |

## Testing

Tests live in the package's existing test layout (to be verified during implementation — likely `packages/tasks/__tests__/` or colocated `*.test.ts`).

### Unit — `SelfCleaningTaskDecorator`

- Normalization across every `selfCleanup` shape (`undefined`, `"never"`, `"always"`, single event, array, array with duplicates).
- `databaseLogs` override: any non-empty event set forces `false`, even when the decoratee sets `true`.
- Hook exposure: `onDone` / `onError` / `onAbort` are always defined on the decorated definition.
- Hook wrapping: user's original hook runs before cleanup; user-hook throw is caught and cleanup still runs.
- Cleanup gating: `cleanupTaskSubtree` is called exactly when the event matches the set, never otherwise.

### Unit — `cleanupTaskSubtree`

- Single task, no descendants: task deleted; logs swept only when that definition's `databaseLogs` is true.
- Multi-level subtree: deletion order is leaves-first; every record is removed.
- Mixed `databaseLogs`: task with `databaseLogs: false` is deleted without any `listLogs` call; task with `databaseLogs: true` has its logs swept.
- Per-record delete failure: `console.warn`, remaining records still deleted.
- Missing definition on a descendant: task deleted, log sweep skipped.
- Idempotent second invocation: no throws.

### Integration — runner + decorator

- `selfCleanup: "onSuccess"` + DONE outcome → task record gone, user's `onDone` ran first.
- `selfCleanup: "onSuccess"` + ERROR outcome → task record present, no cleanup.
- `selfCleanup: "always"` → across DONE / ERROR / ABORTED: zero log records written during the run; task record gone after terminal state.
- Parent with children, `selfCleanup: "onSuccess"` on parent, DONE outcome → parent + entire descendant tree deleted; logs absent.
- `selfCleanup: "onAbort"` — covered once the Section 4 tracing lands and the abort wiring is in place.

## Files

New:

- `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts`

Modified:

- `packages/api-core/src/features/task/TaskDefinition/abstractions.ts` — add `SelfCleanup` / `SelfCleanupEvent` types and the `selfCleanup` field on `ITaskDefinition`.
- `packages/tasks/src/crud/crud.tasks.ts` — add `cleanupTaskSubtree` implementation, expose it on `ITasksContextCrudObject`.
- `packages/tasks/src/types.ts` — extend `ITasksContextCrudObject` with `cleanupTaskSubtree`.
- `packages/tasks/src/context.ts` (or wherever decorators are registered) — register `SelfCleaningTaskDecorator` after `RunnableTaskDecorator`.
- `packages/tasks/src/runner/TaskControl.ts` — **iff** the abort-path trace concludes the runner is the correct hook, add an `onAbort` branch to `runEvents()`.
- A service / feature file (to be identified by the abort-path trace) — **iff** cleanup must be fired there instead.

## Open Questions (resolved during brainstorm)

- Config shape: enum with single value or array (`"always" | "never" | SelfCleanupEvent | SelfCleanupEvent[]`). Confirmed.
- Terminal states covered: `onSuccess`, `onError`, `onAbort` (three separate values, no lumping). Confirmed.
- What gets deleted: task record, its logs, and all descendants recursively. Confirmed.
- `databaseLogs` override: any non-`never` value forces `false`. Confirmed.
- Hook ordering: cleanup runs after the user's lifecycle hook. Confirmed.
- Cleanup failure: swallow + log. Confirmed.
- Per-invocation override: not supported. Confirmed.
- Cascade scope: full descendant tree, not just immediate children. Confirmed.

## Open Items for Implementation

- Trace the abort path (see *Abort Path*) before coding the `onAbort` wiring.
- Verify the parent-terminal-implies-descendants-terminal invariant in the current runner.
- Confirm the exact test-file convention used by `packages/tasks`.
- Decide and validate the decorator's context-access strategy (options A/B/C in *Context access*). If A / B are viable, hook signature is unchanged; if we fall back to C, update `ITaskLifecycleHook` and the "no context" comment in `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`.
