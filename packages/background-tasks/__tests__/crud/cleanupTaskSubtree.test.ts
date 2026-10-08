import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { ITask, ITaskLog } from "~/api/types.js";
import { TaskDataStatus } from "~/api/types.js";
import { TaskLogsRepository, TasksRepository } from "~/api/domain/task/abstractions.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import {
    CleanupTaskSubtreeFeature,
    CleanupTaskSubtreeUseCase
} from "~/api/features/CleanupTaskSubtree/index.js";
import { TaskDefinitionNotFoundError, TaskNotFoundError } from "~/api/domain/errors.js";

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
    const meta = (count: number) => ({ totalCount: count, hasMoreItems: false, cursor: null });

    const tasksRepository = {
        get: async (id: string) => {
            const task = tasks.get(id);
            return task ? Result.ok(task) : Result.fail(new TaskNotFoundError());
        },
        list: async (params?: any) => {
            const parentId = params?.where?.parentId;
            const items = [...tasks.values()].filter(t => (t as any).parentId === parentId);
            return Result.ok({ items, meta: meta(items.length) });
        }
    } as unknown as TasksRepository.Interface;

    const logsRepository = {
        list: async (params: any) => {
            const items = logsByTask.get(params?.where?.task) ?? [];
            return Result.ok({ items, meta: meta(items.length) });
        },
        delete: async (id: string) => {
            deletedLogs.push(id);
            return Result.ok();
        }
    } as unknown as TaskLogsRepository.Interface;

    const deleteTask: DeleteTaskUseCase.Interface = {
        execute: async (id: string) => {
            if (deleteTaskThrows.has(id)) {
                return Result.fail(new TaskNotFoundError());
            }
            deletedTasks.push(id);
            tasks.delete(id);
            return Result.ok();
        }
    };

    const getDefinition = {
        execute: (id: string) => {
            const definition = fx.definitions[id];
            return definition
                ? Result.ok(definition)
                : Result.fail(new TaskDefinitionNotFoundError(id));
        }
    } as unknown as GetRunnableTaskDefinitionUseCase.Interface;

    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() } as unknown as Logger.Interface;

    const container = new Container();
    container.registerInstance(TasksRepository, tasksRepository);
    container.registerInstance(TaskLogsRepository, logsRepository);
    container.registerInstance(DeleteTaskUseCase, deleteTask);
    container.registerInstance(GetRunnableTaskDefinitionUseCase, getDefinition);
    container.registerInstance(Logger, logger);
    CleanupTaskSubtreeFeature.register(container);
    const useCase = container.resolve(CleanupTaskSubtreeUseCase);

    const cleanup = (id: string) => useCase.execute(id);
    return { cleanup, logger, deletedTasks, deletedLogs, deleteTaskThrows };
};

describe("cleanupTaskSubtree", () => {
    it("deletes a single task with no descendants", async () => {
        const { cleanup, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        await cleanup("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs).toEqual([]);
    });

    it("deletes task and its logs when databaseLogs=true", async () => {
        const { cleanup, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("log1", "t1"), mkLog("log2", "t1")],
            definitions: { defA: { databaseLogs: true } }
        });
        await cleanup("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs.sort()).toEqual(["log1", "log2"]);
    });

    it("skips log sweep when databaseLogs=false", async () => {
        const { cleanup, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("stray", "t1")],
            definitions: { defA: { databaseLogs: false } }
        });
        await cleanup("t1");
        expect(deletedLogs).toEqual([]);
    });

    it("deletes descendant tree bottom-up", async () => {
        const { cleanup, deletedTasks } = makeContext({
            tasks: [
                mkTask("root", "defA"),
                mkTask("c1", "defA", "root"),
                mkTask("c2", "defA", "root"),
                mkTask("gc1", "defA", "c1")
            ],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });
        await cleanup("root");
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
        await expect(fx.cleanup("root")).resolves.toBeUndefined();
        expect(fx.deletedTasks).toContain("root");
        expect(fx.logger.warn).toHaveBeenCalled();
    });

    it("is idempotent on missing root id", async () => {
        const { cleanup } = makeContext({ tasks: [], logs: [], definitions: {} });
        await expect(cleanup("ghost")).resolves.toBeUndefined();
    });

    it("skips log sweep when definition is missing", async () => {
        const { cleanup, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defMissing")],
            logs: [mkLog("log1", "t1")],
            definitions: {}
        });
        await cleanup("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs).toEqual([]);
    });

    it("does not infinite-loop when the subtree has a cycle", async () => {
        // Manufacture a cycle: root -> cyc -> root.
        const root = mkTask("root", "defA");
        const cyc = mkTask("cyc", "defA", "root");
        (root as any).parentId = "cyc";

        const { cleanup, deletedTasks } = makeContext({
            tasks: [root, cyc],
            logs: [],
            definitions: { defA: { databaseLogs: false } }
        });

        await expect(cleanup("root")).resolves.toBeUndefined();
        expect(deletedTasks.sort()).toEqual(["cyc", "root"]);
    });
});
