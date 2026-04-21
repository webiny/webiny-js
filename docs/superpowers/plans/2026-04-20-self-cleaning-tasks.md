# Self-Cleaning Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `selfCleanup` field on `ITaskDefinition` that, on matching terminal states (`onSuccess` / `onError` / `onAbort`), deletes the task record, its logs, and its full descendant tree. Task authors opt in per definition.

**Architecture:** A new `SelfCleaningTaskDecorator` wraps task definitions (layered after the existing `RunnableTaskDecorator`). The decorator always exposes `onDone` / `onError` / `onAbort`; each wrapped hook runs the user's hook first, then — if the matching event is in the configured set — calls `context.tasks.cleanupTaskSubtree(taskId)`. The new CRUD helper walks the subtree with `listTasks({ where: { parentId } })` and deletes bottom-up, best-effort. To give the decorator access to the CRUD, `ITaskLifecycleHook` is extended to `{ task, context }` (additive). Any non-`"never"` `selfCleanup` also forces `databaseLogs: false`.

**Tech Stack:** TypeScript · `@webiny/feature` · `@webiny/api-core` · Jest · monorepo yarn scripts.

**Reference spec:** `docs/superpowers/specs/2026-04-20-self-cleaning-tasks-design.md`.

**Commits policy:** This repo is set up so the user commits manually. Do **not** run `git commit`. The plan uses **Checkpoint** markers to indicate good points to pause and let the user commit.

**Test runner:** `yarn test packages/tasks 2>&1 | tail -80` from the repo root. Use `--testPathPattern` to target one file.

---

## File Structure

**New files:**

- `packages/tasks/src/utils/normalizeSelfCleanup.ts` — pure helper: parses the public `SelfCleanup` value into a `ReadonlySet<SelfCleanupEvent>`.
- `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts` — decorator that wraps a task definition.
- `packages/tasks/__tests__/utils/normalizeSelfCleanup.test.ts`
- `packages/tasks/__tests__/decorators/SelfCleaningTaskDecorator.test.ts`
- `packages/tasks/__tests__/crud/cleanupTaskSubtree.test.ts`
- `packages/tasks/__tests__/runner/selfCleanup.integration.test.ts`

**Modified files:**

- `packages/api-core/src/features/task/TaskDefinition/abstractions.ts` — add `SelfCleanupEvent`, `SelfCleanup` types; add `selfCleanup?` to `ITaskDefinition` and `IRunnableTaskDefinition`; extend `ITaskLifecycleHook` from `{ task }` to `{ task, context }`; update the doc comment that currently says "no context".
- `packages/tasks/src/types.ts` — re-export `SelfCleanup` / `SelfCleanupEvent`; add `cleanupTaskSubtree(taskId: string): Promise<void>` on `ITasksContextCrudObject`.
- `packages/tasks/src/crud/crud.tasks.ts` — implement `cleanupTaskSubtree` and expose it from `createTaskCrud`.
- `packages/tasks/src/context.ts` — register `SelfCleaningTaskDecorator` immediately after `RunnableTaskDecorator`.
- `packages/tasks/src/runner/TaskControl.ts` — in `runEvents()`, pass `{ task, context: this.context }` to `onDone` / `onError` (lines 184, 193).
- `packages/tasks/src/crud/service.tasks.ts` — in the abort use case, pass `{ task: updatedTask, context }` to `definition.onAbort` (line 203).
- `packages/tasks/__tests__/helpers/createTaskDefinition.ts` — extend to accept `selfCleanup`, `onDone`, `onError`, `onAbort` so integration tests can register decorated definitions.

---

## Task 1: Add `SelfCleanup` types and extend `ITaskLifecycleHook`

**Files:**
- Modify: `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`
- Modify: `packages/tasks/src/types.ts`

- [ ] **Step 1: Edit `abstractions.ts` — add types and update `ITaskLifecycleHook`**

Open `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`.

Replace lines 90-93 (`ITaskLifecycleHook` definition) with:

```ts
export type ITaskLifecycleHook<
    I extends ITaskInput = ITaskInput,
    O extends ITaskOutput = ITaskOutput
> = {
    task: ITask<I, O>;
    /**
     * Tenant context exposed to lifecycle hooks so decorators and user code can
     * access CRUD and other request-scoped features. Typed as unknown here to
     * avoid a circular package dependency; callsites cast to the concrete type.
     */
    context: unknown;
};
```

Below `export type ITaskResult ...` (around line 88), add the self-cleanup event types:

```ts
export type SelfCleanupEvent = "onSuccess" | "onError" | "onAbort";

export type SelfCleanup =
    | "always"
    | "never"
    | SelfCleanupEvent
    | ReadonlyArray<SelfCleanupEvent>;
```

In `ITaskDefinition` (lines 98-130), add `selfCleanup` after `isPrivate`:

```ts
isPrivate?: boolean;
selfCleanup?: SelfCleanup;
```

`IRunnableTaskDefinition` does not need a change — `selfCleanup` inherits from `ITaskDefinition` as optional. The `SelfCleaningTaskDecorator` normalizes it internally into an event set; it does not store a canonicalized `SelfCleanup` back onto the definition.

No namespace re-export is needed — consumers import `SelfCleanup` / `SelfCleanupEvent` directly from `@webiny/api-core/features/task/TaskDefinition/index.js` (same module path the types are declared in). The existing `export namespace TaskDefinition { ... }` block stays untouched for now.

Update the doc comment on line 117 from:

```ts
/**
 * Optional lifecycle hooks - receive task data, no context
 */
```

to:

```ts
/**
 * Optional lifecycle hooks - receive task data and the tenant context.
 */
```

- [ ] **Step 2: Edit `packages/tasks/src/types.ts` — re-export types and extend CRUD interface**

Near the existing imports (top of file), add:

```ts
import type { SelfCleanup, SelfCleanupEvent } from "@webiny/api-core/features/task/TaskDefinition/index.js";
```

At the bottom of `types.ts` (after the existing `export type ITask<...>`), add:

```ts
export type { SelfCleanup, SelfCleanupEvent };
```

In `ITasksContextCrudObject` (lines 163-204), add the new method after `deleteTask`:

```ts
deleteTask(id: string): Promise<IDeleteTaskResponse>;
/**
 * Recursively delete a task, its logs (if any were written), and its entire
 * descendant subtree. Best-effort: per-record failures are logged and swallowed,
 * the method never throws.
 */
cleanupTaskSubtree(id: string): Promise<void>;
```

- [ ] **Step 3: Type-check — no test yet, just `tsc` via build**

Run:
```bash
yarn build -p @webiny/api-core 2>&1 | tail -20
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: both builds fail on `packages/tasks/src/crud/crud.tasks.ts` (missing `cleanupTaskSubtree` in return value) and on the runner/service callsites that still pass `{ task }` without `context`.

That failure is expected and will be resolved by Tasks 2, 4, 5 below. Build failures introduced by this task alone should be limited to:

1. `cleanupTaskSubtree` missing from `createTaskCrud` return — fixed in Task 4.
2. `ITaskLifecycleHook` callsites — fixed in Task 2.

If other failures appear, re-inspect `abstractions.ts` — you probably broke the namespace or forgot a semicolon.

- [ ] **Step 4: Checkpoint — stop for user commit**

Changes so far: public types added, lifecycle hook signature extended. User may commit: `feat(tasks): add SelfCleanup types and extend ITaskLifecycleHook with context`.

---

## Task 2: Pass `context` to lifecycle hook callsites

**Files:**
- Modify: `packages/tasks/src/runner/TaskControl.ts:182-200`
- Modify: `packages/tasks/src/crud/service.tasks.ts:202-206`

- [ ] **Step 1: Edit `TaskControl.ts`**

Open `packages/tasks/src/runner/TaskControl.ts`. Replace lines 182-200 with:

```ts
if (result.status === TaskResultStatus.ERROR && definition.onError) {
    try {
        await definition.onError({
            task,
            context: this.context
        });
    } catch (ex) {
        console.error(`Error executing onError hook for task "${task.id}".`);
        console.log(getErrorProperties(ex));
    }
} else if (result.status === TaskResultStatus.DONE && definition.onDone) {
    try {
        await definition.onDone({
            task,
            context: this.context
        });
    } catch (ex) {
        console.error(`Error executing onDone hook for task "${task.id}".`);
        console.log(getErrorProperties(ex));
    }
}
```

- [ ] **Step 2: Edit `service.tasks.ts`**

Open `packages/tasks/src/crud/service.tasks.ts`. Replace lines 202-206 with:

```ts
if (definition.onAbort) {
    await definition.onAbort({
        task: updatedTask,
        context
    });
}
```

(`context` is already in scope in `createServiceCrud(context)`.)

- [ ] **Step 3: Rebuild**

Run:
```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: only remaining failure is `cleanupTaskSubtree` missing from `createTaskCrud` return. Everything else builds.

- [ ] **Step 4: Checkpoint**

User may commit: `feat(tasks): pass context to onDone/onError/onAbort lifecycle hooks`.

---

## Task 3: `normalizeSelfCleanup` helper (TDD)

**Files:**
- Create: `packages/tasks/src/utils/normalizeSelfCleanup.ts`
- Test: `packages/tasks/__tests__/utils/normalizeSelfCleanup.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/tasks/__tests__/utils/normalizeSelfCleanup.test.ts`:

```ts
import { normalizeSelfCleanup } from "~/utils/normalizeSelfCleanup.js";

describe("normalizeSelfCleanup", () => {
    it("returns empty set when input is undefined", () => {
        expect(normalizeSelfCleanup(undefined).size).toBe(0);
    });

    it("returns empty set when input is 'never'", () => {
        expect(normalizeSelfCleanup("never").size).toBe(0);
    });

    it("expands 'always' to all three events", () => {
        const set = normalizeSelfCleanup("always");
        expect(set.has("onSuccess")).toBe(true);
        expect(set.has("onError")).toBe(true);
        expect(set.has("onAbort")).toBe(true);
        expect(set.size).toBe(3);
    });

    it("accepts a single event", () => {
        const set = normalizeSelfCleanup("onSuccess");
        expect(set.has("onSuccess")).toBe(true);
        expect(set.size).toBe(1);
    });

    it("accepts an array", () => {
        const set = normalizeSelfCleanup(["onSuccess", "onError"]);
        expect(set.has("onSuccess")).toBe(true);
        expect(set.has("onError")).toBe(true);
        expect(set.has("onAbort")).toBe(false);
        expect(set.size).toBe(2);
    });

    it("collapses duplicates in an array", () => {
        const set = normalizeSelfCleanup(["onSuccess", "onSuccess", "onError"]);
        expect(set.size).toBe(2);
    });

    it("returns a readonly set type", () => {
        // Runtime: the Set is frozen-equivalent — we return it typed readonly.
        const set = normalizeSelfCleanup("always");
        // @ts-expect-error — Set#add not exposed by ReadonlySet type
        expect(() => set.add("onSuccess")).toBeDefined();
    });
});
```

- [ ] **Step 2: Run to verify failure**

Run:
```bash
yarn test packages/tasks --testPathPattern normalizeSelfCleanup 2>&1 | tail -40
```

Expected: FAIL — "Cannot find module '~/utils/normalizeSelfCleanup.js'".

- [ ] **Step 3: Implement**

Create `packages/tasks/src/utils/normalizeSelfCleanup.ts`:

```ts
import type { SelfCleanup, SelfCleanupEvent } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const ALL_EVENTS: ReadonlyArray<SelfCleanupEvent> = ["onSuccess", "onError", "onAbort"];

export const normalizeSelfCleanup = (
    value: SelfCleanup | undefined
): ReadonlySet<SelfCleanupEvent> => {
    if (value === undefined || value === "never") {
        return new Set();
    }
    if (value === "always") {
        return new Set(ALL_EVENTS);
    }
    if (Array.isArray(value)) {
        return new Set(value);
    }
    return new Set([value]);
};
```

- [ ] **Step 4: Run tests to verify pass**

Run:
```bash
yarn test packages/tasks --testPathPattern normalizeSelfCleanup 2>&1 | tail -40
```

Expected: PASS — all seven tests green.

- [ ] **Step 5: Checkpoint**

User may commit: `feat(tasks): add normalizeSelfCleanup helper`.

---

## Task 4: `cleanupTaskSubtree` CRUD helper (TDD)

**Files:**
- Modify: `packages/tasks/src/crud/crud.tasks.ts` (add implementation inside `createTaskCrud`)
- Test: `packages/tasks/__tests__/crud/cleanupTaskSubtree.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/tasks/__tests__/crud/cleanupTaskSubtree.test.ts`:

```ts
import { createTaskCrud } from "~/crud/crud.tasks.js";
import type { Context, ITasksContextCrudObject, ITask, ITaskLog } from "~/types.js";
import { TaskDataStatus } from "~/types.js";

// Minimal in-memory CRUD fake built on top of the real createTaskCrud ideally,
// but cleanupTaskSubtree only needs listTasks / listLogs / deleteTask / deleteLog
// and getDefinition — so we build a lightweight context double here and call
// the helper directly. For the end-to-end integration with the CMS storage,
// see the integration test in Task 8.

const buildContext = (opts: {
    tasks: ITask[];
    logs: ITaskLog[];
    definitions: Record<string, { databaseLogs?: boolean } | undefined>;
}) => {
    const tasksById = new Map(opts.tasks.map(t => [t.id, t]));
    const logsByTask = new Map<string, ITaskLog[]>();
    opts.logs.forEach(log => {
        const arr = logsByTask.get(log.task) ?? [];
        arr.push(log);
        logsByTask.set(log.task, arr);
    });

    const deleted: { tasks: string[]; logs: string[] } = { tasks: [], logs: [] };

    const crud: Partial<ITasksContextCrudObject> = {
        listTasks: async params => {
            const parentId = params?.where?.parentId;
            const items = [...tasksById.values()].filter(t => t.parentId === parentId);
            return { items, meta: { totalCount: items.length, hasMoreItems: false, cursor: null } } as any;
        },
        listLogs: async params => {
            const items = logsByTask.get(params.where?.task as string) ?? [];
            return { items, meta: { totalCount: items.length, hasMoreItems: false, cursor: null } } as any;
        },
        deleteTask: async id => {
            deleted.tasks.push(id);
            tasksById.delete(id);
            return true;
        },
        deleteLog: async id => {
            deleted.logs.push(id);
            return true;
        }
    };

    const context = {
        tasks: {
            ...crud,
            getDefinition: (id: string) => opts.definitions[id] ?? null
        }
    } as unknown as Context;

    return { context, deleted };
};

const mkTask = (id: string, definitionId: string, parentId?: string): ITask => ({
    id, definitionId, parentId,
    name: id, input: {}, taskStatus: TaskDataStatus.SUCCESS,
    createdBy: { id: "u", displayName: "u", type: "user" },
    createdOn: "", savedOn: "", executionName: "", iterations: 0
}) as any;

const mkLog = (id: string, taskId: string): ITaskLog => ({
    id, task: taskId, iteration: 1,
    createdBy: { id: "u", displayName: "u", type: "user" },
    createdOn: "", executionName: "", items: []
});

describe("cleanupTaskSubtree", () => {
    it("deletes a single task with no descendants", async () => {
        const { context, deleted } = buildContext({
            tasks: [mkTask("t1", "defA")],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        // cleanupTaskSubtree is part of createTaskCrud(context); here we invoke it
        // through the crud factory, which requires the full context — for purity
        // we construct the minimal helper. In real code the helper lives inside
        // createTaskCrud and closes over `context`. Use a thin wrapper to invoke:
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        await crud.cleanupTaskSubtree("t1");
        expect(deleted.tasks).toEqual(["t1"]);
        expect(deleted.logs).toEqual([]);
    });

    it("deletes task and its logs when definition has databaseLogs=true", async () => {
        const { context, deleted } = buildContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("log1", "t1"), mkLog("log2", "t1")],
            definitions: { defA: { databaseLogs: true } }
        });
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        await crud.cleanupTaskSubtree("t1");
        expect(deleted.tasks).toEqual(["t1"]);
        expect(deleted.logs.sort()).toEqual(["log1", "log2"]);
    });

    it("skips log sweep when definition has databaseLogs=false", async () => {
        const { context, deleted } = buildContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("stray", "t1")], // should not be swept
            definitions: { defA: { databaseLogs: false } }
        });
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        await crud.cleanupTaskSubtree("t1");
        expect(deleted.tasks).toEqual(["t1"]);
        expect(deleted.logs).toEqual([]);
    });

    it("deletes a full descendant tree bottom-up", async () => {
        const { context, deleted } = buildContext({
            tasks: [
                mkTask("root", "defA"),
                mkTask("c1", "defA", "root"),
                mkTask("c2", "defA", "root"),
                mkTask("gc1", "defA", "c1")
            ],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        await crud.cleanupTaskSubtree("root");

        // Every task deleted
        expect(deleted.tasks.sort()).toEqual(["c1", "c2", "gc1", "root"]);

        // Bottom-up: grandchild before its parent, children before root
        const idx = (id: string) => deleted.tasks.indexOf(id);
        expect(idx("gc1")).toBeLessThan(idx("c1"));
        expect(idx("c1")).toBeLessThan(idx("root"));
        expect(idx("c2")).toBeLessThan(idx("root"));
    });

    it("continues when a single delete fails", async () => {
        const { context, deleted } = buildContext({
            tasks: [mkTask("root", "defA"), mkTask("c1", "defA", "root")],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        const origDelete = crud.deleteTask;
        (crud as any).deleteTask = async (id: string) => {
            if (id === "c1") throw new Error("boom");
            return origDelete(id);
        };
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        await expect(crud.cleanupTaskSubtree("root")).resolves.toBeUndefined();
        expect(deleted.tasks).toContain("root");
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("is idempotent — second call on missing id does not throw", async () => {
        const { context } = buildContext({ tasks: [], logs: [], definitions: {} });
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        await expect(crud.cleanupTaskSubtree("gone")).resolves.toBeUndefined();
    });

    it("skips log sweep when definition is missing", async () => {
        const { context, deleted } = buildContext({
            tasks: [mkTask("t1", "defMissing")],
            logs: [mkLog("log1", "t1")],
            definitions: {}
        });
        const crud = context.tasks as unknown as ITasksContextCrudObject;
        await crud.cleanupTaskSubtree("t1");
        expect(deleted.tasks).toEqual(["t1"]);
        expect(deleted.logs).toEqual([]);
    });
});
```

Note: tests stub `context.tasks` with a partial fake including the new `cleanupTaskSubtree`. The helper under test is installed onto the fake via the real `createTaskCrud(context)` — see Step 3 for how to wire it so the tests invoke the real implementation.

Actually — to make the tests invoke the real helper, the setup must rely on the fact that `createTaskCrud(context)` uses the `context.tasks` surface for other CRUD calls. Simpler: move the helper implementation into a standalone function `createCleanupTaskSubtree(ctx)` that `createTaskCrud` composes, and have the tests call that standalone function directly. Revise Step 3 accordingly — see below.

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
yarn test packages/tasks --testPathPattern cleanupTaskSubtree 2>&1 | tail -40
```

Expected: FAIL — `cleanupTaskSubtree is not a function` or import errors.

- [ ] **Step 3: Extract the helper into its own factory and wire into `createTaskCrud`**

Create `packages/tasks/src/crud/cleanupTaskSubtree.ts`:

```ts
import type { Context, ITask } from "~/types.js";

/**
 * Recursively deletes the task identified by `rootId`, all its descendants, and
 * their logs (when the owning definition has databaseLogs=true). Bottom-up,
 * best-effort: per-record errors are logged and swallowed, the function never
 * throws.
 */
export const createCleanupTaskSubtree = (context: Context) => {
    const listChildren = async (parentId: string): Promise<ITask[]> => {
        const { items } = await context.tasks.listTasks({
            where: { parentId }
        });
        return items;
    };

    const collectSubtree = async (rootId: string): Promise<ITask[]> => {
        const root = await context.tasks.getTask(rootId);
        if (!root) {
            return [];
        }
        const order: ITask[] = [root];
        const seen = new Set<string>([root.id]);
        let i = 0;
        while (i < order.length) {
            const current = order[i++];
            const kids = await listChildren(current.id);
            for (const kid of kids) {
                if (seen.has(kid.id)) {
                    continue;
                }
                seen.add(kid.id);
                order.push(kid);
            }
        }
        return order.reverse(); // leaves first
    };

    const deleteTaskLogs = async (task: ITask): Promise<void> => {
        const definition = context.tasks.getDefinition(task.definitionId);
        if (!definition || definition.databaseLogs !== true) {
            return;
        }
        try {
            const { items } = await context.tasks.listLogs({
                where: { task: task.id }
            });
            for (const log of items) {
                try {
                    await context.tasks.deleteLog(log.id);
                } catch (ex) {
                    console.warn(
                        `cleanupTaskSubtree: failed to delete log "${log.id}" for task "${task.id}": ${ex.message}`
                    );
                }
            }
        } catch (ex) {
            console.warn(
                `cleanupTaskSubtree: failed to list logs for task "${task.id}": ${ex.message}`
            );
        }
    };

    return async (rootId: string): Promise<void> => {
        const ordered = await collectSubtree(rootId);
        for (const task of ordered) {
            await deleteTaskLogs(task);
            try {
                await context.tasks.deleteTask(task.id);
            } catch (ex) {
                console.warn(
                    `cleanupTaskSubtree: failed to delete task "${task.id}": ${ex.message}`
                );
            }
        }
    };
};
```

Now wire it into `createTaskCrud` at `packages/tasks/src/crud/crud.tasks.ts`.

At the top of the file (near other imports) add:

```ts
import { createCleanupTaskSubtree } from "./cleanupTaskSubtree.js";
```

In `createTaskCrud(context)`, just before the `return { ... }` block (around line 457), add:

```ts
const cleanupTaskSubtree = createCleanupTaskSubtree(context);
```

Include it in the returned object:

```ts
return {
    getTask,
    listTasks,
    createTask,
    updateTask,
    deleteTask,
    cleanupTaskSubtree,
    createLog,
    ...
};
```

- [ ] **Step 4: Rewrite the test to call the standalone factory**

Replace the entire test file content with a version that imports the factory directly:

```ts
import { createCleanupTaskSubtree } from "~/crud/cleanupTaskSubtree.js";
import type { Context, ITask, ITaskLog, ITasksContextCrudObject } from "~/types.js";
import { TaskDataStatus } from "~/types.js";

const mkTask = (id: string, definitionId: string, parentId?: string): ITask => ({
    id,
    definitionId,
    parentId,
    name: id,
    input: {},
    taskStatus: TaskDataStatus.SUCCESS,
    createdBy: { id: "u", displayName: "u", type: "user" },
    createdOn: "",
    savedOn: "",
    executionName: "",
    iterations: 0
}) as unknown as ITask;

const mkLog = (id: string, taskId: string): ITaskLog => ({
    id,
    task: taskId,
    iteration: 1,
    createdBy: { id: "u", displayName: "u", type: "user" },
    createdOn: "",
    executionName: "",
    items: []
});

interface Fixture {
    tasks: ITask[];
    logs: ITaskLog[];
    definitions: Record<string, { databaseLogs?: boolean } | undefined>;
}

const makeContext = (fx: Fixture) => {
    const tasks = new Map(fx.tasks.map(t => [t.id, t]));
    const logsByTask = new Map<string, ITaskLog[]>();
    fx.logs.forEach(l => {
        const arr = logsByTask.get(l.task) ?? [];
        arr.push(l);
        logsByTask.set(l.task, arr);
    });

    const deletedTasks: string[] = [];
    const deletedLogs: string[] = [];
    const deleteTaskThrows = new Set<string>();

    const crud: Partial<ITasksContextCrudObject> & { getDefinition: any } = {
        getTask: async (id: string) => (tasks.get(id) ?? null) as any,
        listTasks: (async (params?: any) => {
            const parentId = params?.where?.parentId;
            const items = [...tasks.values()].filter(t => (t as any).parentId === parentId);
            return { items, meta: { totalCount: items.length, hasMoreItems: false, cursor: null } };
        }) as any,
        listLogs: (async (params: any) => {
            const items = logsByTask.get(params?.where?.task) ?? [];
            return { items, meta: { totalCount: items.length, hasMoreItems: false, cursor: null } };
        }) as any,
        deleteTask: (async (id: string) => {
            if (deleteTaskThrows.has(id)) {
                throw new Error(`boom:${id}`);
            }
            deletedTasks.push(id);
            tasks.delete(id);
            return true;
        }) as any,
        deleteLog: (async (id: string) => {
            deletedLogs.push(id);
            return true;
        }) as any,
        getDefinition: (id: string) => fx.definitions[id] ?? null
    };

    const context = { tasks: crud } as unknown as Context;
    return { context, deletedTasks, deletedLogs, deleteTaskThrows };
};

describe("cleanupTaskSubtree", () => {
    it("deletes a single task with no descendants", async () => {
        const { context, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        const cleanup = createCleanupTaskSubtree(context);
        await cleanup("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs).toEqual([]);
    });

    it("deletes task and its logs when databaseLogs=true", async () => {
        const { context, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("log1", "t1"), mkLog("log2", "t1")],
            definitions: { defA: { databaseLogs: true } }
        });
        await createCleanupTaskSubtree(context)("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs.sort()).toEqual(["log1", "log2"]);
    });

    it("skips log sweep when databaseLogs=false", async () => {
        const { context, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("stray", "t1")],
            definitions: { defA: { databaseLogs: false } }
        });
        await createCleanupTaskSubtree(context)("t1");
        expect(deletedLogs).toEqual([]);
    });

    it("deletes descendant tree bottom-up", async () => {
        const { context, deletedTasks } = makeContext({
            tasks: [
                mkTask("root", "defA"),
                mkTask("c1", "defA", "root"),
                mkTask("c2", "defA", "root"),
                mkTask("gc1", "defA", "c1")
            ],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        await createCleanupTaskSubtree(context)("root");
        expect(deletedTasks.sort()).toEqual(["c1", "c2", "gc1", "root"]);
        const pos = (id: string) => deletedTasks.indexOf(id);
        expect(pos("gc1")).toBeLessThan(pos("c1"));
        expect(pos("c1")).toBeLessThan(pos("root"));
        expect(pos("c2")).toBeLessThan(pos("root"));
    });

    it("continues on per-record delete failure", async () => {
        const fx = makeContext({
            tasks: [mkTask("root", "defA"), mkTask("c1", "defA", "root")],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        fx.deleteTaskThrows.add("c1");
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        await expect(createCleanupTaskSubtree(fx.context)("root")).resolves.toBeUndefined();
        expect(fx.deletedTasks).toContain("root");
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("is idempotent on missing root id", async () => {
        const { context } = makeContext({ tasks: [], logs: [], definitions: {} });
        await expect(createCleanupTaskSubtree(context)("ghost")).resolves.toBeUndefined();
    });

    it("skips log sweep when definition is missing", async () => {
        const { context, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defMissing")],
            logs: [mkLog("log1", "t1")],
            definitions: {}
        });
        await createCleanupTaskSubtree(context)("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs).toEqual([]);
    });
});
```

- [ ] **Step 5: Run tests to verify pass**

Run:
```bash
yarn test packages/tasks --testPathPattern cleanupTaskSubtree 2>&1 | tail -40
```

Expected: PASS — seven tests green.

- [ ] **Step 6: Rebuild**

Run:
```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 7: Checkpoint**

User may commit: `feat(tasks): add cleanupTaskSubtree CRUD helper`.

---

## Task 5: `SelfCleaningTaskDecorator` (TDD)

**Files:**
- Create: `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts`
- Test: `packages/tasks/__tests__/decorators/SelfCleaningTaskDecorator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/tasks/__tests__/decorators/SelfCleaningTaskDecorator.test.ts`:

```ts
import { SelfCleaningTaskDecoratorImpl } from "~/decorators/SelfCleaningTaskDecorator.js";
import { TaskDataStatus } from "~/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context, ITask } from "~/types.js";

const fakeTask = (id = "t1"): ITask => ({
    id,
    definitionId: "defA",
    name: id,
    input: {},
    taskStatus: TaskDataStatus.SUCCESS,
    createdBy: { id: "u", displayName: "u", type: "user" },
    createdOn: "",
    savedOn: "",
    executionName: "",
    iterations: 0
}) as unknown as ITask;

const makeContext = () => {
    const cleaned: string[] = [];
    const context = {
        tasks: {
            cleanupTaskSubtree: async (id: string) => {
                cleaned.push(id);
            }
        }
    } as unknown as Context;
    return { context, cleaned };
};

const makeDefinition = (
    overrides: Partial<TaskDefinition.Interface> = {}
): TaskDefinition.Interface => ({
    id: "defA",
    title: "test",
    run: async () => ({ status: "done" } as any),
    ...overrides
}) as TaskDefinition.Interface;

describe("SelfCleaningTaskDecorator", () => {
    describe("normalization", () => {
        it("keeps databaseLogs when selfCleanup is undefined", () => {
            const base = makeDefinition({ databaseLogs: true });
            const dec = new SelfCleaningTaskDecoratorImpl(base);
            expect(dec.databaseLogs).toBe(true);
        });

        it("keeps databaseLogs when selfCleanup is 'never'", () => {
            const base = makeDefinition({ databaseLogs: true, selfCleanup: "never" });
            const dec = new SelfCleaningTaskDecoratorImpl(base);
            expect(dec.databaseLogs).toBe(true);
        });

        it("forces databaseLogs=false when selfCleanup is a single event", () => {
            const base = makeDefinition({ databaseLogs: true, selfCleanup: "onSuccess" });
            const dec = new SelfCleaningTaskDecoratorImpl(base);
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is an array", () => {
            const base = makeDefinition({
                databaseLogs: true,
                selfCleanup: ["onSuccess", "onError"]
            });
            const dec = new SelfCleaningTaskDecoratorImpl(base);
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is 'always'", () => {
            const base = makeDefinition({ databaseLogs: true, selfCleanup: "always" });
            const dec = new SelfCleaningTaskDecoratorImpl(base);
            expect(dec.databaseLogs).toBe(false);
        });
    });

    describe("hook exposure", () => {
        it("always exposes onDone / onError / onAbort even if the decoratee has none", () => {
            const dec = new SelfCleaningTaskDecoratorImpl(makeDefinition());
            expect(typeof dec.onDone).toBe("function");
            expect(typeof dec.onError).toBe("function");
            expect(typeof dec.onAbort).toBe("function");
        });
    });

    describe("cleanup gating", () => {
        it("does NOT trigger cleanup when event is not in the set", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: "onError" })
            );
            await dec.onDone!({ task: fakeTask(), context });
            expect(cleaned).toEqual([]);
        });

        it("triggers cleanup on onSuccess when configured", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: "onSuccess" })
            );
            await dec.onDone!({ task: fakeTask("t42"), context });
            expect(cleaned).toEqual(["t42"]);
        });

        it("triggers cleanup on onError when configured", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: ["onError"] })
            );
            await dec.onError!({ task: fakeTask("t1"), context });
            expect(cleaned).toEqual(["t1"]);
        });

        it("triggers cleanup on onAbort when configured", async () => {
            const { context, cleaned } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({ selfCleanup: "always" })
            );
            await dec.onAbort!({ task: fakeTask(), context });
            expect(cleaned).toEqual(["t1"]);
        });
    });

    describe("hook wrapping", () => {
        it("invokes user's onDone before cleanup", async () => {
            const order: string[] = [];
            const { context } = makeContext();
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({
                    selfCleanup: "onSuccess",
                    onDone: async () => {
                        order.push("user");
                    }
                })
            );
            (context.tasks as any).cleanupTaskSubtree = async () => {
                order.push("cleanup");
            };
            await dec.onDone!({ task: fakeTask(), context });
            expect(order).toEqual(["user", "cleanup"]);
        });

        it("runs cleanup even when user's hook throws", async () => {
            const { context, cleaned } = makeContext();
            const warn = jest.spyOn(console, "error").mockImplementation(() => {});
            const dec = new SelfCleaningTaskDecoratorImpl(
                makeDefinition({
                    selfCleanup: "onSuccess",
                    onDone: async () => {
                        throw new Error("user-boom");
                    }
                })
            );
            await dec.onDone!({ task: fakeTask("t99"), context });
            expect(cleaned).toEqual(["t99"]);
            warn.mockRestore();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
yarn test packages/tasks --testPathPattern SelfCleaningTaskDecorator 2>&1 | tail -40
```

Expected: FAIL — `Cannot find module '~/decorators/SelfCleaningTaskDecorator.js'`.

- [ ] **Step 3: Implement the decorator**

Create `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts`:

```ts
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { SelfCleanupEvent } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { RunnableTaskDecorator } from "./RunnableTaskDecorator.js";
import { normalizeSelfCleanup } from "~/utils/normalizeSelfCleanup.js";
import type { Context } from "~/types.js";
import { getErrorProperties } from "~/utils/getErrorProperties.js";

type LifecycleHook = TaskDefinition.Interface["onDone"];
type HookParams = Parameters<NonNullable<LifecycleHook>>[0];

export class SelfCleaningTaskDecoratorImpl implements TaskDefinition.Interface {
    private readonly events: ReadonlySet<SelfCleanupEvent>;

    public constructor(private decoratee: TaskDefinition.Interface) {
        this.events = normalizeSelfCleanup(decoratee.selfCleanup);
    }

    // Pass-through properties.
    get id() {
        return this.decoratee.id;
    }
    get title() {
        return this.decoratee.title;
    }
    get description() {
        return this.decoratee.description;
    }
    get isPrivate() {
        return this.decoratee.isPrivate;
    }
    get maxIterations() {
        return this.decoratee.maxIterations;
    }
    get selfCleanup() {
        return this.decoratee.selfCleanup;
    }
    get createInputValidation() {
        return this.decoratee.createInputValidation;
    }
    get run() {
        return this.decoratee.run.bind(this.decoratee);
    }
    get onBeforeTrigger() {
        return this.decoratee.onBeforeTrigger?.bind(this.decoratee);
    }
    get onMaxIterations() {
        return this.decoratee.onMaxIterations?.bind(this.decoratee);
    }

    // databaseLogs override — any non-empty event set forces false.
    get databaseLogs() {
        if (this.events.size > 0) {
            return false;
        }
        return this.decoratee.databaseLogs;
    }

    // Always-defined lifecycle hooks. Each runs the user's hook first, then
    // triggers cleanup if the matching event is in the set.
    get onDone() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onDone, params, "onDone");
            if (this.events.has("onSuccess")) {
                await this.runCleanup(params);
            }
        };
    }

    get onError() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onError, params, "onError");
            if (this.events.has("onError")) {
                await this.runCleanup(params);
            }
        };
    }

    get onAbort() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onAbort, params, "onAbort");
            if (this.events.has("onAbort")) {
                await this.runCleanup(params);
            }
        };
    }

    private async runCleanup(params: HookParams): Promise<void> {
        const context = params.context as Context;
        await context.tasks.cleanupTaskSubtree(params.task.id);
    }

    private async safeCall(
        hook: LifecycleHook | undefined,
        params: HookParams,
        name: string
    ): Promise<void> {
        if (!hook) {
            return;
        }
        try {
            await hook.call(this.decoratee, params);
        } catch (ex) {
            console.error(`Error executing ${name} hook for task "${params.task.id}".`);
            console.log(getErrorProperties(ex));
        }
    }
}

export const SelfCleaningTaskDecorator = TaskDefinition.createDecorator({
    decorator: SelfCleaningTaskDecoratorImpl,
    dependencies: [RunnableTaskDecorator]
});
```

Note: the decorator exports both the class (`SelfCleaningTaskDecoratorImpl`) — for unit testing without IoC — and the registered decorator (`SelfCleaningTaskDecorator`) — for `context.ts` registration.

- [ ] **Step 4: Run tests to verify pass**

Run:
```bash
yarn test packages/tasks --testPathPattern SelfCleaningTaskDecorator 2>&1 | tail -40
```

Expected: PASS — all tests green.

- [ ] **Step 5: Build**

Run:
```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 6: Checkpoint**

User may commit: `feat(tasks): add SelfCleaningTaskDecorator`.

---

## Task 6: Register the decorator

**Files:**
- Modify: `packages/tasks/src/context.ts:25`

- [ ] **Step 1: Edit `context.ts`**

Open `packages/tasks/src/context.ts`. At the top, add the import next to the existing `RunnableTaskDecorator` import:

```ts
import { RunnableTaskDecorator } from "./decorators/RunnableTaskDecorator.js";
import { SelfCleaningTaskDecorator } from "./decorators/SelfCleaningTaskDecorator.js";
```

In `createTasksCrud`, immediately after line 25 (the existing `RunnableTaskDecorator` registration), add:

```ts
context.container.registerDecorator(RunnableTaskDecorator);
context.container.registerDecorator(SelfCleaningTaskDecorator);
```

- [ ] **Step 2: Build**

Run:
```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 3: Checkpoint**

User may commit: `feat(tasks): register SelfCleaningTaskDecorator`.

---

## Task 7: Extend the test helper

**Files:**
- Modify: `packages/tasks/__tests__/helpers/createTaskDefinition.ts`

- [ ] **Step 1: Edit the helper**

Replace the contents of `packages/tasks/__tests__/helpers/createTaskDefinition.ts` with:

```ts
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createContextPlugin } from "@webiny/api";
import type { SelfCleanup } from "@webiny/api-core/features/task/TaskDefinition/index.js";

interface TaskParams<T> {
    id: string;
    title: string;
    description?: string;
    selfCleanup?: SelfCleanup;
    databaseLogs?: boolean;
    run: (params: TaskDefinition.RunParams) => T;
    createInputValidation?: TaskDefinition.Interface["createInputValidation"];
    onDone?: TaskDefinition.Interface["onDone"];
    onError?: TaskDefinition.Interface["onError"];
    onAbort?: TaskDefinition.Interface["onAbort"];
}

export function createTaskDefinition<T extends TaskDefinition.Result>(params: TaskParams<T>) {
    class TestingRunTask implements TaskDefinition.Interface {
        id = params.id;
        title = params.title;
        description = params.description;
        selfCleanup = params.selfCleanup;
        databaseLogs = params.databaseLogs;

        async run({ input, controller }: TaskDefinition.RunParams) {
            return params.run({ input, controller });
        }

        createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
            if (params.createInputValidation) {
                return params.createInputValidation({ validator });
            }
            return {};
        }

        onDone = params.onDone;
        onError = params.onError;
        onAbort = params.onAbort;
    }

    const TestTaskDefinition = TaskDefinition.createImplementation({
        implementation: TestingRunTask,
        dependencies: []
    });

    return createContextPlugin(context => {
        context.container.register(TestTaskDefinition);
    });
}
```

- [ ] **Step 2: Rebuild**

Run:
```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 3: Checkpoint**

User may commit: `test(tasks): extend createTaskDefinition helper for selfCleanup / hooks`.

---

## Task 8: Integration test — runner + decorator end-to-end

**Files:**
- Test: `packages/tasks/__tests__/runner/selfCleanup.integration.test.ts`

- [ ] **Step 1: Scan an existing integration test for the harness pattern**

Skim `packages/tasks/__tests__/runner/taskRunnerSuccess.test.ts` (or similar) — identify how it imports `useTaskHandler`, registers definitions, and triggers them. You need the exact signatures used in this repo because harness APIs drift. Do NOT copy code blindly; adapt the two cases below to those exact signatures.

- [ ] **Step 2: Write the integration tests**

Create `packages/tasks/__tests__/runner/selfCleanup.integration.test.ts`. Adjust the harness imports to match what `taskRunnerSuccess.test.ts` uses:

```ts
import { useTaskHandler } from "../helpers/useTaskHandler.js";
import { createTaskDefinition } from "../helpers/createTaskDefinition.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

describe("selfCleanup integration", () => {
    it("selfCleanup='onSuccess' deletes the task record after DONE", async () => {
        const definition = createTaskDefinition({
            id: "cleanupSuccess",
            title: "cleanupSuccess",
            selfCleanup: "onSuccess",
            run: async () => ({ status: TaskResultStatus.DONE })
        });
        const { handler, triggerAndWait, context } = useTaskHandler({ plugins: [definition] });

        const task = await triggerAndWait({ definition: "cleanupSuccess", input: {} });
        expect(task).toBeDefined();

        // After the task finishes, the record should be gone.
        const fetched = await context.tasks.getTask(task.id);
        expect(fetched).toBeNull();
    });

    it("selfCleanup='onSuccess' does NOT delete the record on ERROR", async () => {
        const definition = createTaskDefinition({
            id: "cleanupErrorOnly",
            title: "cleanupErrorOnly",
            selfCleanup: "onSuccess",
            run: async () => ({
                status: TaskResultStatus.ERROR,
                error: { message: "boom" }
            })
        });
        const { triggerAndWait, context } = useTaskHandler({ plugins: [definition] });

        const task = await triggerAndWait({ definition: "cleanupErrorOnly", input: {} });
        const fetched = await context.tasks.getTask(task.id);
        expect(fetched).not.toBeNull();
    });

    it("selfCleanup='always' deletes the task and writes no log records", async () => {
        const definition = createTaskDefinition({
            id: "cleanupAlways",
            title: "cleanupAlways",
            databaseLogs: true, // explicitly try to enable logs
            selfCleanup: "always",
            run: async () => ({ status: TaskResultStatus.DONE })
        });
        const { triggerAndWait, context } = useTaskHandler({ plugins: [definition] });

        const task = await triggerAndWait({ definition: "cleanupAlways", input: {} });

        // Task gone.
        expect(await context.tasks.getTask(task.id)).toBeNull();

        // Logs: none exist — the decorator forced databaseLogs=false.
        const logs = await context.tasks.listLogs({ where: { task: task.id } });
        expect(logs.items).toHaveLength(0);
    });

    it("selfCleanup on parent deletes the full descendant tree", async () => {
        const child = createTaskDefinition({
            id: "cleanupChild",
            title: "cleanupChild",
            run: async () => ({ status: TaskResultStatus.DONE })
        });
        const parent = createTaskDefinition({
            id: "cleanupParent",
            title: "cleanupParent",
            selfCleanup: "onSuccess",
            run: async ({ controller }) => {
                // Spawn one child synchronously.
                await controller.trigger({
                    definition: "cleanupChild",
                    input: {}
                });
                return { status: TaskResultStatus.DONE };
            }
        });

        const { triggerAndWait, context } = useTaskHandler({
            plugins: [parent, child]
        });

        const task = await triggerAndWait({ definition: "cleanupParent", input: {} });

        // Parent gone.
        expect(await context.tasks.getTask(task.id)).toBeNull();

        // Children of the parent — none should remain.
        const remaining = await context.tasks.listTasks({
            where: { parentId: task.id }
        });
        expect(remaining.items).toHaveLength(0);
    });
});
```

If `triggerAndWait` isn't the exact helper name, replace with whatever the existing runner tests use (e.g., `useTaskHandler().runTask()`). Do **not** invent helper names — use only names that already exist in the harness.

- [ ] **Step 3: Run the tests**

Run:
```bash
yarn test packages/tasks --testPathPattern selfCleanup.integration 2>&1 | tail -80
```

Expected: PASS. If FAIL, the most likely cause is a harness API mismatch — re-read `taskRunnerSuccess.test.ts` and align.

- [ ] **Step 4: Run the full package test suite**

Run:
```bash
yarn test packages/tasks 2>&1 | tail -50
```

Expected: all tests pass. If any pre-existing tests now fail, the most likely cause is the `ITaskLifecycleHook` signature change (Task 1) — grep for `onDone({` / `onError({` / `onAbort({` in other test files and update callers to include `context`.

- [ ] **Step 5: Checkpoint**

User may commit: `test(tasks): integration tests for self-cleaning tasks`.

---

## Task 9: Preflight

Follows the project's "Before Commit" checklist from `CLAUDE.md`.

- [ ] **Step 1: Stage, install, regenerate tsconfigs, check deps**

Run each, fix any errors before continuing:

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js 2>&1 | tail -10
yarn adio 2>&1 | tail -20
```

Expected: no output from `yarn`, no errors from `adio` beyond known warnings.

- [ ] **Step 2: Format**

```bash
yarn prettier:fix > /dev/null 2>&1
```

- [ ] **Step 3: Lint**

```bash
yarn eslint 2>&1 | tail -30
```

Expected: no errors in the touched files. Fix any lint issues and re-run.

- [ ] **Step 4: Sync Webiny dependencies**

```bash
yarn webiny sync-dependencies 2>&1 | tail -10
```

- [ ] **Step 5: Final test pass**

```bash
yarn test packages/tasks 2>&1 | tail -40
```

Expected: all green.

- [ ] **Step 6: Build one more time**

```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
yarn build -p @webiny/api-core 2>&1 | tail -20
```

Expected: both succeed.

- [ ] **Step 7: Checkpoint — ready for user commit**

Feature complete. The user runs their own `git add` / `git commit` sequence per their workflow.

---

## Notes & Caveats

**Invariant — parent terminal ⇒ descendants terminal.** The spec calls this out. It's the task author's responsibility to ensure their parent task awaits children before returning. If they opt into `selfCleanup` on a parent whose children may still be running, the cascade will delete running children's records. This is documented and accepted per the brainstorming conversation.

**`ITaskLifecycleHook.context` typed as `unknown`.** To avoid a circular package dependency (`api-core` already depends on `@webiny/api`, but `Context` in `packages/tasks` extends `CmsContext` and pulls in more), the field is typed `unknown` at the abstraction and cast at the callsite. Inside `SelfCleaningTaskDecoratorImpl` the cast is `params.context as Context` — safe because the decorator only runs inside the tasks package runtime.

**Public API change.** `ITaskLifecycleHook` gains a `context` field. This is additive — user code written against `{ task }` continues to compile. User code that destructures exhaustively (rare) will compile but see an unused field. Not a breaking change in practice.

**No new events.** `cleanupTaskSubtree` reuses `TaskBefore/AfterDeleteEvent` and `TaskBefore/AfterUpdate` for each deletion. Consumers who want to react to cleanup can listen on those.
