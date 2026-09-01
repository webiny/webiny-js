# Self-Cleaning Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `selfCleanup` field on `ITaskDefinition` that, on matching terminal states (`onSuccess` / `onError` / `onAbort`), deletes the task record, its logs, and its full descendant tree. Task authors opt in per definition.

**Architecture:** A new `SelfCleaningTaskDecorator` wraps task definitions (layered after the existing `RunnableTaskDecorator`). The decorator receives a `CleanupTaskSubtreeUseCase` instance via DI constructor injection — **`ITaskLifecycleHook` is not extended with `context`**; the lifecycle hook signature stays as `{ task }` only. The decorator always exposes `onDone` / `onError` / `onAbort`; each wrapped hook runs the user's hook first, then — if the matching event is in the configured set — calls `cleanupTaskSubtree.execute(taskId)`. `CleanupTaskSubtreeUseCase` is a proper UseCase abstraction (registered in the IoC container) that internally calls `context.tasks.cleanupTaskSubtree()`. The CRUD helper walks the subtree with `listTasks({ where: { parentId } })` and deletes bottom-up, best-effort. Any non-`"never"` `selfCleanup` also forces `databaseLogs: false`.

**Tech Stack:** TypeScript · `@webiny/feature` · `@webiny/api-core` · Jest · monorepo yarn scripts.

**Reference spec:** `docs/superpowers/specs/2026-04-20-self-cleaning-tasks-design.md`.

**Commits policy:** This repo is set up so the user commits manually. Do **not** run `git commit`. The plan uses **Checkpoint** markers to indicate good points to pause and let the user commit.

**Test runner:** `yarn test packages/tasks 2>&1 | tail -80` from the repo root. Use `--testPathPattern` to target one file.

---

## File Structure

**New files:**

- `packages/tasks/src/utils/normalizeSelfCleanup.ts` — pure helper: parses `ISelfCleanup` into a `ReadonlySet<ISelfCleanupEvent>`.
- `packages/tasks/src/features/CleanupTaskSubtree/abstractions.ts` — `ICleanupTaskSubtreeUseCase` interface + `CleanupTaskSubtreeUseCase` abstraction token.
- `packages/tasks/src/features/CleanupTaskSubtree/CleanupTaskSubtreeUseCase.ts` — impl that delegates to `context.tasks.cleanupTaskSubtree()`.
- `packages/tasks/src/features/CleanupTaskSubtree/index.ts` — re-exports.
- `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts` — decorator; receives `CleanupTaskSubtreeUseCase` via DI injection.
- `packages/tasks/__tests__/utils/normalizeSelfCleanup.test.ts`
- `packages/tasks/__tests__/decorators/SelfCleaningTaskDecorator.test.ts`
- `packages/tasks/__tests__/crud/cleanupTaskSubtree.test.ts`
- `packages/tasks/__tests__/runner/selfCleanup.integration.test.ts`

**Modified files:**

- `packages/api-core/src/features/task/TaskDefinition/abstractions.ts` — add `ISelfCleanupEvent`, `ISelfCleanup` types (with `I` prefix); add `selfCleanup?` to `ITaskDefinition`; add `TaskDefinition.SelfCleanupEvent` / `TaskDefinition.SelfCleanup` namespace aliases. `ITaskLifecycleHook` stays as `{ task }` — no `context` field.
- `packages/tasks/src/types.ts` — re-export `SelfCleanup` / `SelfCleanupEvent`; add `cleanupTaskSubtree(id: string): Promise<void>` on `ITasksContextCrudObject`.
- `packages/tasks/src/crud/crud.tasks.ts` — implement `cleanupTaskSubtree` and expose it from `createTaskCrud`.
- `packages/tasks/src/context.ts` — register `SelfCleaningTaskDecorator` immediately after `RunnableTaskDecorator`; register `CleanupTaskSubtreeUseCaseImpl` against the `CleanupTaskSubtreeUseCase` abstraction.
- `packages/tasks/__tests__/helpers/createTaskDefinition.ts` — extend to accept `selfCleanup`, `onDone`, `onError`, `onAbort` so integration tests can register decorated definitions.

---

## Task 1: Add `ISelfCleanup` types to `abstractions.ts` and extend `ITasksContextCrudObject`

**Files:**
- Modify: `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`
- Modify: `packages/tasks/src/types.ts`

- [ ] **Step 1: Edit `abstractions.ts` — add types**

Open `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`.

Below `export type ITaskResult ...`, add the self-cleanup event types (with `I` prefix):

```ts
export type ISelfCleanupEvent = "onSuccess" | "onError" | "onAbort";

export type ISelfCleanup =
    | "always"
    | "never"
    | ISelfCleanupEvent
    | ISelfCleanupEvent[];
```

In `ITaskDefinition`, add `selfCleanup` after `isPrivate`:

```ts
isPrivate?: boolean;
selfCleanup?: ISelfCleanup;
```

In the `TaskDefinition` namespace block, add the aliases:

```ts
export type SelfCleanupEvent = ISelfCleanupEvent;
export type SelfCleanup = ISelfCleanup;
```

`ITaskLifecycleHook` is **not changed** — it stays as `{ task }` only.

- [ ] **Step 2: Edit `packages/tasks/src/types.ts` — re-export types and extend CRUD interface**

At the top of file, add imports:

```ts
import type { ISelfCleanup, ISelfCleanupEvent } from "@webiny/api-core/features/task/TaskDefinition/index.js";
```

At the bottom of the exports, add:

```ts
export type { ISelfCleanup as SelfCleanup, ISelfCleanupEvent as SelfCleanupEvent };
```

In `ITasksContextCrudObject`, add after `deleteTask`:

```ts
deleteTask(id: string): Promise<IDeleteTaskResponse>;
/**
 * Recursively delete a task, its logs (if any were written), and its entire
 * descendant subtree. Best-effort: per-record failures are logged and swallowed,
 * the method never throws.
 */
cleanupTaskSubtree(id: string): Promise<void>;
```

- [ ] **Step 3: Type-check via build**

Run:
```bash
yarn build -p @webiny/api-core 2>&1 | tail -20
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: `@webiny/api-core` builds clean. `@webiny/tasks` fails only on missing `cleanupTaskSubtree` in `createTaskCrud` return — fixed in Task 2.

- [ ] **Step 4: Checkpoint**

User may commit: `feat(tasks): add ISelfCleanup types and cleanupTaskSubtree to CRUD interface`.

---

## Task 2: `cleanupTaskSubtree` CRUD helper (TDD)

**Files:**
- Modify: `packages/tasks/src/crud/crud.tasks.ts`
- Test: `packages/tasks/__tests__/crud/cleanupTaskSubtree.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/tasks/__tests__/crud/cleanupTaskSubtree.test.ts`:

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

- [ ] **Step 2: Run to verify failure**

```bash
yarn test packages/tasks --testPathPattern cleanupTaskSubtree 2>&1 | tail -40
```

Expected: FAIL — cannot find module `~/crud/cleanupTaskSubtree.js`.

- [ ] **Step 3: Implement the standalone factory**

Create `packages/tasks/src/crud/cleanupTaskSubtree.ts`:

```ts
import type { Context, ITask } from "~/types.js";

export const createCleanupTaskSubtree = (context: Context) => {
    const listChildren = async (parentId: string): Promise<ITask[]> => {
        const { items } = await context.tasks.listTasks({ where: { parentId } });
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
        return order.reverse();
    };

    const deleteTaskLogs = async (task: ITask): Promise<void> => {
        const definition = context.tasks.getDefinition(task.definitionId);
        if (!definition || definition.databaseLogs !== true) {
            return;
        }
        try {
            const { items } = await context.tasks.listLogs({ where: { task: task.id } });
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

Wire into `createTaskCrud` in `packages/tasks/src/crud/crud.tasks.ts`:

```ts
import { createCleanupTaskSubtree } from "./cleanupTaskSubtree.js";
// ...
const cleanupTaskSubtree = createCleanupTaskSubtree(context);
return {
    // ...existing methods...
    cleanupTaskSubtree,
};
```

- [ ] **Step 4: Run tests to verify pass**

```bash
yarn test packages/tasks --testPathPattern cleanupTaskSubtree 2>&1 | tail -40
```

Expected: PASS — all seven tests green.

- [ ] **Step 5: Rebuild**

```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 6: Checkpoint**

User may commit: `feat(tasks): add cleanupTaskSubtree CRUD helper`.

---

## Task 3: `CleanupTaskSubtreeUseCase` feature (UseCase abstraction)

**Files:**
- Create: `packages/tasks/src/features/CleanupTaskSubtree/abstractions.ts`
- Create: `packages/tasks/src/features/CleanupTaskSubtree/CleanupTaskSubtreeUseCase.ts`
- Create: `packages/tasks/src/features/CleanupTaskSubtree/index.ts`

- [ ] **Step 1: Create the abstraction**

Create `packages/tasks/src/features/CleanupTaskSubtree/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ICleanupTaskSubtreeUseCase {
    execute(taskId: string): Promise<void>;
}

export const CleanupTaskSubtreeUseCase = createAbstraction<ICleanupTaskSubtreeUseCase>(
    "Tasks/CleanupTaskSubtreeUseCase"
);

export namespace CleanupTaskSubtreeUseCase {
    export type Interface = ICleanupTaskSubtreeUseCase;
}
```

- [ ] **Step 2: Create the implementation**

Create `packages/tasks/src/features/CleanupTaskSubtree/CleanupTaskSubtreeUseCase.ts`:

```ts
import { CleanupTaskSubtreeUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Context } from "~/types.js";

export class CleanupTaskSubtreeUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly context: Context) {}

    public async execute(taskId: string): Promise<void> {
        await this.context.tasks.cleanupTaskSubtree(taskId);
    }
}
```

- [ ] **Step 3: Create the index**

Create `packages/tasks/src/features/CleanupTaskSubtree/index.ts`:

```ts
export { CleanupTaskSubtreeUseCase } from "./abstractions.js";
export { CleanupTaskSubtreeUseCaseImpl } from "./CleanupTaskSubtreeUseCase.js";
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 5: Checkpoint**

User may commit: `feat(tasks): add CleanupTaskSubtreeUseCase feature`.

---

## Task 4: `normalizeSelfCleanup` helper (TDD)

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
});
```

- [ ] **Step 2: Run to verify failure**

```bash
yarn test packages/tasks --testPathPattern normalizeSelfCleanup 2>&1 | tail -40
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

Create `packages/tasks/src/utils/normalizeSelfCleanup.ts`:

```ts
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const ALL_EVENTS: ReadonlyArray<TaskDefinition.SelfCleanupEvent> = ["onSuccess", "onError", "onAbort"];

export const normalizeSelfCleanup = (
    value: TaskDefinition.SelfCleanup | undefined
): ReadonlySet<TaskDefinition.SelfCleanupEvent> => {
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

```bash
yarn test packages/tasks --testPathPattern normalizeSelfCleanup 2>&1 | tail -40
```

Expected: PASS.

- [ ] **Step 5: Checkpoint**

User may commit: `feat(tasks): add normalizeSelfCleanup helper`.

---

## Task 5: `SelfCleaningTaskDecorator` (TDD)

**Files:**
- Create: `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts`
- Test: `packages/tasks/__tests__/decorators/SelfCleaningTaskDecorator.test.ts`

The decorator receives `CleanupTaskSubtreeUseCase` via DI constructor injection. It does **not** access context through the hook `params` — `ITaskLifecycleHook` stays as `{ task }` only.

- [ ] **Step 1: Write the failing tests**

Create `packages/tasks/__tests__/decorators/SelfCleaningTaskDecorator.test.ts`:

```ts
import { SelfCleaningTaskDecoratorImpl } from "~/decorators/SelfCleaningTaskDecorator.js";
import { TaskDataStatus } from "~/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { ITask } from "~/types.js";
import type { CleanupTaskSubtreeUseCase } from "~/features/CleanupTaskSubtree/index.js";

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

const makeCleanupUseCase = () => {
    const cleaned: string[] = [];
    const useCase: CleanupTaskSubtreeUseCase.Interface = {
        execute: async (id: string) => {
            cleaned.push(id);
        }
    };
    return { useCase, cleaned };
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
            const { useCase } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ databaseLogs: true }));
            expect(dec.databaseLogs).toBe(true);
        });

        it("keeps databaseLogs when selfCleanup is 'never'", () => {
            const { useCase } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ databaseLogs: true, selfCleanup: "never" }));
            expect(dec.databaseLogs).toBe(true);
        });

        it("forces databaseLogs=false when selfCleanup is a single event", () => {
            const { useCase } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ databaseLogs: true, selfCleanup: "onSuccess" }));
            expect(dec.databaseLogs).toBe(false);
        });

        it("forces databaseLogs=false when selfCleanup is 'always'", () => {
            const { useCase } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ databaseLogs: true, selfCleanup: "always" }));
            expect(dec.databaseLogs).toBe(false);
        });
    });

    describe("hook exposure", () => {
        it("always exposes onDone / onError / onAbort even if the decoratee has none", () => {
            const { useCase } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition());
            expect(typeof dec.onDone).toBe("function");
            expect(typeof dec.onError).toBe("function");
            expect(typeof dec.onAbort).toBe("function");
        });
    });

    describe("cleanup gating", () => {
        it("does NOT trigger cleanup when event is not in the set", async () => {
            const { useCase, cleaned } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ selfCleanup: "onError" }));
            await dec.onDone!({ task: fakeTask() });
            expect(cleaned).toEqual([]);
        });

        it("triggers cleanup on onSuccess when configured", async () => {
            const { useCase, cleaned } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ selfCleanup: "onSuccess" }));
            await dec.onDone!({ task: fakeTask("t42") });
            expect(cleaned).toEqual(["t42"]);
        });

        it("triggers cleanup on onError when configured", async () => {
            const { useCase, cleaned } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ selfCleanup: ["onError"] }));
            await dec.onError!({ task: fakeTask("t1") });
            expect(cleaned).toEqual(["t1"]);
        });

        it("triggers cleanup on onAbort when configured", async () => {
            const { useCase, cleaned } = makeCleanupUseCase();
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({ selfCleanup: "always" }));
            await dec.onAbort!({ task: fakeTask("t1") });
            expect(cleaned).toEqual(["t1"]);
        });
    });

    describe("hook wrapping", () => {
        it("invokes user's onDone before cleanup", async () => {
            const order: string[] = [];
            const useCase: CleanupTaskSubtreeUseCase.Interface = {
                execute: async () => { order.push("cleanup"); }
            };
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({
                selfCleanup: "onSuccess",
                onDone: async () => { order.push("user"); }
            }));
            await dec.onDone!({ task: fakeTask() });
            expect(order).toEqual(["user", "cleanup"]);
        });

        it("runs cleanup even when user's hook throws", async () => {
            const { useCase, cleaned } = makeCleanupUseCase();
            const warn = jest.spyOn(console, "error").mockImplementation(() => {});
            const dec = new SelfCleaningTaskDecoratorImpl(useCase, makeDefinition({
                selfCleanup: "onSuccess",
                onDone: async () => { throw new Error("user-boom"); }
            }));
            await dec.onDone!({ task: fakeTask("t99") });
            expect(cleaned).toEqual(["t99"]);
            warn.mockRestore();
        });
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
yarn test packages/tasks --testPathPattern SelfCleaningTaskDecorator 2>&1 | tail -40
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement the decorator**

Create `packages/tasks/src/decorators/SelfCleaningTaskDecorator.ts`:

```ts
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { ISelfCleanupEvent } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { normalizeSelfCleanup } from "~/utils/normalizeSelfCleanup.js";
import { getErrorProperties } from "~/utils/getErrorProperties.js";
import {
    CleanupTaskSubtreeUseCase,
    CleanupTaskSubtreeUseCaseImpl
} from "~/features/CleanupTaskSubtree/index.js";

type LifecycleHook = TaskDefinition.Interface["onDone"];
type HookParams = Parameters<NonNullable<LifecycleHook>>[0];

export class SelfCleaningTaskDecoratorImpl implements TaskDefinition.Interface {
    private readonly events: ReadonlySet<ISelfCleanupEvent>;

    public constructor(
        private readonly cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface,
        private decoratee: TaskDefinition.Interface
    ) {
        this.events = normalizeSelfCleanup(decoratee.selfCleanup);
    }

    get id() { return this.decoratee.id; }
    get title() { return this.decoratee.title; }
    get description() { return this.decoratee.description; }
    get isPrivate() { return this.decoratee.isPrivate; }
    get maxIterations() { return this.decoratee.maxIterations; }
    get selfCleanup() { return this.decoratee.selfCleanup; }
    get createInputValidation() { return this.decoratee.createInputValidation; }
    get run() { return this.decoratee.run.bind(this.decoratee); }
    get onBeforeTrigger() { return this.decoratee.onBeforeTrigger?.bind(this.decoratee); }
    get onMaxIterations() { return this.decoratee.onMaxIterations?.bind(this.decoratee); }

    get databaseLogs() {
        if (this.events.size > 0) {
            return false;
        }
        return this.decoratee.databaseLogs;
    }

    get onDone() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onDone, params, "onDone");
            if (this.events.has("onSuccess")) {
                await this.cleanupTaskSubtree.execute(params.task.id);
            }
        };
    }

    get onError() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onError, params, "onError");
            if (this.events.has("onError")) {
                await this.cleanupTaskSubtree.execute(params.task.id);
            }
        };
    }

    get onAbort() {
        return async (params: HookParams) => {
            await this.safeCall(this.decoratee.onAbort, params, "onAbort");
            if (this.events.has("onAbort")) {
                await this.cleanupTaskSubtree.execute(params.task.id);
            }
        };
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
    dependencies: [CleanupTaskSubtreeUseCase]
});
```

- [ ] **Step 4: Run tests to verify pass**

```bash
yarn test packages/tasks --testPathPattern SelfCleaningTaskDecorator 2>&1 | tail -40
```

Expected: PASS.

- [ ] **Step 5: Build**

```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 6: Checkpoint**

User may commit: `feat(tasks): add SelfCleaningTaskDecorator`.

---

## Task 6: Register the decorator and UseCase

**Files:**
- Modify: `packages/tasks/src/context.ts`

- [ ] **Step 1: Edit `context.ts`**

Add imports:

```ts
import { SelfCleaningTaskDecorator } from "./decorators/SelfCleaningTaskDecorator.js";
import {
    CleanupTaskSubtreeUseCase,
    CleanupTaskSubtreeUseCaseImpl
} from "~/features/CleanupTaskSubtree/index.js";
```

After registering `RunnableTaskDecorator`, add:

```ts
context.container.registerDecorator(RunnableTaskDecorator);
context.container.registerDecorator(SelfCleaningTaskDecorator);
```

Register the UseCase implementation (in the same setup block):

```ts
context.container.bind(
    CleanupTaskSubtreeUseCase,
    new CleanupTaskSubtreeUseCaseImpl(context)
);
```

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
```

Expected: success.

- [ ] **Step 3: Checkpoint**

User may commit: `feat(tasks): register SelfCleaningTaskDecorator and CleanupTaskSubtreeUseCase`.

---

## Task 7: Extend the test helper

**Files:**
- Modify: `packages/tasks/__tests__/helpers/createTaskDefinition.ts`

- [ ] **Step 1: Edit the helper**

Add `selfCleanup`, `onDone`, `onError`, `onAbort` support:

```ts
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createContextPlugin } from "@webiny/api";
import type { ISelfCleanup } from "@webiny/api-core/features/task/TaskDefinition/index.js";

interface TaskParams<T> {
    id: string;
    title: string;
    description?: string;
    selfCleanup?: ISelfCleanup;
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

Skim `packages/tasks/__tests__/runner/taskRunnerSuccess.test.ts` (or similar) — identify how it imports `useTaskHandler`, registers definitions, and triggers them. Adapt the cases below to those exact signatures.

- [ ] **Step 2: Write the integration tests**

Create `packages/tasks/__tests__/runner/selfCleanup.integration.test.ts`. Adjust harness imports to match what the existing runner tests use:

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
        const { triggerAndWait, context } = useTaskHandler({ plugins: [definition] });

        const task = await triggerAndWait({ definition: "cleanupSuccess", input: {} });
        const fetched = await context.tasks.getTask(task.id);
        expect(fetched).toBeNull();
    });

    it("selfCleanup='onSuccess' does NOT delete the record on ERROR", async () => {
        const definition = createTaskDefinition({
            id: "cleanupErrorOnly",
            title: "cleanupErrorOnly",
            selfCleanup: "onSuccess",
            run: async () => ({ status: TaskResultStatus.ERROR, error: { message: "boom" } })
        });
        const { triggerAndWait, context } = useTaskHandler({ plugins: [definition] });

        const task = await triggerAndWait({ definition: "cleanupErrorOnly", input: {} });
        expect(await context.tasks.getTask(task.id)).not.toBeNull();
    });

    it("selfCleanup='always' deletes the task and writes no log records", async () => {
        const definition = createTaskDefinition({
            id: "cleanupAlways",
            title: "cleanupAlways",
            databaseLogs: true,
            selfCleanup: "always",
            run: async () => ({ status: TaskResultStatus.DONE })
        });
        const { triggerAndWait, context } = useTaskHandler({ plugins: [definition] });

        const task = await triggerAndWait({ definition: "cleanupAlways", input: {} });
        expect(await context.tasks.getTask(task.id)).toBeNull();
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
                await controller.trigger({ definition: "cleanupChild", input: {} });
                return { status: TaskResultStatus.DONE };
            }
        });

        const { triggerAndWait, context } = useTaskHandler({ plugins: [parent, child] });
        const task = await triggerAndWait({ definition: "cleanupParent", input: {} });

        expect(await context.tasks.getTask(task.id)).toBeNull();
        const remaining = await context.tasks.listTasks({ where: { parentId: task.id } });
        expect(remaining.items).toHaveLength(0);
    });
});
```

- [ ] **Step 3: Run the tests**

```bash
yarn test packages/tasks --testPathPattern selfCleanup.integration 2>&1 | tail -80
```

Expected: PASS. If FAIL on harness API mismatch, re-read `taskRunnerSuccess.test.ts` and align.

- [ ] **Step 4: Run the full package test suite**

```bash
yarn test packages/tasks 2>&1 | tail -50
```

Expected: all tests pass.

- [ ] **Step 5: Checkpoint**

User may commit: `test(tasks): integration tests for self-cleaning tasks`.

---

## Task 9: Preflight

Follows the project's "Before Commit" checklist from `CLAUDE.md`.

- [ ] **Step 1: Install, regenerate tsconfigs, check deps**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js 2>&1 | tail -10
yarn adio 2>&1 | tail -20
```

- [ ] **Step 2: Format**

```bash
yarn format > /dev/null 2>&1
```

- [ ] **Step 3: Lint**

```bash
yarn lint 2>&1 | tail -30
```

- [ ] **Step 4: Sync Webiny dependencies**

```bash
yarn webiny sync-dependencies 2>&1 | tail -10
```

- [ ] **Step 5: Final test pass**

```bash
yarn test packages/tasks 2>&1 | tail -40
```

- [ ] **Step 6: Build**

```bash
yarn build -p @webiny/tasks 2>&1 | tail -20
yarn build -p @webiny/api-core 2>&1 | tail -20
```

- [ ] **Step 7: Checkpoint — ready for user commit**

Feature complete.

---

## Notes & Caveats

**No `context` in `ITaskLifecycleHook`.** The approach of adding `context: unknown` to the hook interface was abandoned. Instead, `CleanupTaskSubtreeUseCase` is a first-class UseCase abstraction registered in the IoC container and injected into `SelfCleaningTaskDecoratorImpl` via the `dependencies` array in `createDecorator`. Hook callsites (`TaskControl.ts`, `service.tasks.ts`) remain unchanged — they still pass `{ task }` only.

**`ISelfCleanupEvent` / `ISelfCleanup` naming.** Raw types use the `I` prefix. `TaskDefinition.SelfCleanupEvent` and `TaskDefinition.SelfCleanup` are namespace aliases pointing to the same types — consumers use either form.

**`databaseLogs` forced false.** Any non-`"never"` `selfCleanup` makes the decorator override `databaseLogs` to `false`. This happens at decoration time (constructor), before any task runs.

**Invariant — parent terminal ⇒ descendants terminal.** The task author's responsibility: a parent opting into `selfCleanup` must ensure children are terminal before returning. Cleanup of a parent with still-running children will delete those children's records.

**No new domain events.** `cleanupTaskSubtree` reuses `TaskBefore/AfterDeleteEvent` for each deletion. Consumers reacting to cleanup listen on those existing events.
