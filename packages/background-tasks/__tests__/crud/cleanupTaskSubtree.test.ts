import { describe, it, expect, vi } from "vitest";
import { createCleanupTaskSubtree } from "~/api/crud/cleanupTaskSubtree.js";
import type { Context, ITask, ITaskLog, ITasksContextCrudObject } from "~/api/types.js";
import { TaskDataStatus } from "~/api/types.js";

const mkTask = (id: string, definitionId: string, parentId?: string): ITask =>
    ({
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

    const crud: Partial<ITasksContextCrudObject> & {
        getDefinition: (id: string) => { databaseLogs?: boolean } | null;
    } = {
        getTask: (async (id: string) => tasks.get(id) ?? null) as any,
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
        expect([...deletedTasks].sort()).toEqual(["c1", "c2", "gc1", "root"]);
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
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
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

    it("does not infinite-loop when the subtree has a cycle", async () => {
        // Manufacture a cycle: root -> cyc -> root.
        const root = mkTask("root", "defA");
        const cyc = mkTask("cyc", "defA", "root");
        (root as any).parentId = "cyc";

        const { context, deletedTasks } = makeContext({
            tasks: [root, cyc],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });

        await expect(createCleanupTaskSubtree(context)("root")).resolves.toBeUndefined();
        expect(deletedTasks.sort()).toEqual(["cyc", "root"]);
    });
});
