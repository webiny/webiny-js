import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ListTasksUseCase } from "@webiny/background-tasks/api/features/ListTasks/index.js";
import { UpdateTaskUseCase } from "@webiny/background-tasks/api/features/UpdateTask/index.js";
import { TaskDataStatus } from "@webiny/background-tasks/api/types.js";
import type { ITask } from "@webiny/background-tasks/api/types.js";
import { BackgroundTasksLoop } from "~/domain/BackgroundTasksLoop.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { RandomProcessOwner } from "~/claim/RandomProcessOwner.js";
import { KeyValueTaskClaim } from "~/claim/KeyValueTaskClaim.js";
import { KeyValueTaskRecoveries } from "~/claim/KeyValueTaskRecoveries.js";
import { MAX_RECOVERIES } from "~/claim/constants.js";
import { RECOVER_GRACE_MS } from "~/claim/constants.js";
import { RecoverTasksHandler } from "~/recovery/RecoverTasksHandler.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { ProcessShutdownSignal } from "~/shutdown/ProcessShutdownSignal.js";
import { TaskRecoverEventHandler } from "~/recovery/TaskRecoverEventHandler.js";
import { createMemoryKeyValueStore } from "./helpers/createMemoryKeyValueStore.js";

const TTL_MS = 60_000;

interface ITenantSetup {
    id: string;
    status?: string;
    isInstalled?: boolean;
    tasks?: ITask[];
    // Listing this tenant's tasks fails.
    broken?: boolean;
}

const createTask = (id: string, overrides: Partial<ITask> = {}): ITask => {
    const savedAtMs = Date.now() - RECOVER_GRACE_MS - 1000;
    const savedAt = new Date(savedAtMs);
    const savedOn = savedAt.toISOString();
    return {
        id,
        definitionId: "testDef",
        name: id,
        taskStatus: TaskDataStatus.RUNNING,
        executionName: "",
        input: {},
        iterations: 1,
        eventResponse: undefined,
        createdOn: savedOn,
        savedOn,
        createdBy: { id: "admin", type: "admin", displayName: "Admin" },
        ...overrides
    } as ITask;
};

/*
 * One process's recovery over the given tenants. `store` is shared, so a second process built on it
 * sees the first one's claims.
 */
const createRecovery = (tenants: ITenantSetup[], shared = createMemoryKeyValueStore()) => {
    let currentTenant: string | undefined;
    const start = vi.fn();
    const updateTask = vi.fn(async () => Result.ok({} as any));
    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger.Interface;

    const container = new Container();
    container.registerInstance(GlobalKeyValueStore, shared.store);
    container.registerInstance(ListTenantsUseCase, {
        execute: async () => Result.ok(tenants.map(t => ({ isInstalled: true, ...t })) as any)
    });
    container.registerInstance(TenantContext, {
        withTenant: async (tenant: { id: string }, cb: (tenant: any) => Promise<unknown>) => {
            currentTenant = tenant.id;
            return cb(tenant);
        }
    } as unknown as TenantContext.Interface);
    container.registerInstance(ListTasksUseCase, {
        execute: async () => {
            const tenant = tenants.find(t => t.id === currentTenant);
            if (tenant?.broken) {
                return Result.fail(new Error("storage unavailable") as any);
            }
            const items = tenant?.tasks ?? [];
            return Result.ok({ items, meta: { hasMoreItems: false, cursor: null, totalCount: 0 } });
        }
    } as unknown as ListTasksUseCase.Interface);
    container.registerInstance(UpdateTaskUseCase, { execute: updateTask } as any);
    container.registerInstance(BackgroundTasksLoop, { start, stop: vi.fn() });
    container.registerInstance(Logger, logger);
    container.register(RandomProcessOwner).inSingletonScope();
    container.register(KeyValueTaskClaim);
    container.register(KeyValueTaskRecoveries);
    container.register(ProcessShutdownSignal).inSingletonScope();
    container.register(RecoverTasksHandler);

    const handler = container.resolve(TaskRecoverEventHandler);
    const claim = container.resolve(TaskClaim);
    const next = async () => undefined;
    const recover = () => handler.execute({} as any, next);

    const shutdown = container.resolve(ShutdownSignal);

    return { recover, start, updateTask, claim, shared, shutdown };
};

describe("RecoverTasksHandler", () => {
    it("resumes the unfinished tasks nobody holds", async () => {
        const tasks = [
            createTask("running-1"),
            createTask("pending-1", { taskStatus: TaskDataStatus.PENDING })
        ];
        const { recover, start } = createRecovery([{ id: "root", tasks }]);

        const result = await recover();

        expect(result).toEqual({ resumed: 2, failed: 0, failedTenants: [] });
        expect(start).toHaveBeenCalledWith(
            expect.objectContaining({ webinyTaskId: "running-1", tenant: "root", delay: 0 })
        );
        expect(start).toHaveBeenCalledWith(expect.objectContaining({ webinyTaskId: "pending-1" }));
    });

    it("leaves a task alone while another process holds it", async () => {
        const tasks = [createTask("task-1")];
        const owner = createRecovery([{ id: "root", tasks }]);
        await owner.claim.take({ tenant: "root", taskId: "task-1" }, TTL_MS);

        const other = createRecovery([{ id: "root", tasks }], owner.shared);
        const result = await other.recover();

        expect(result.resumed).toBe(0);
        expect(other.start).not.toHaveBeenCalled();
    });

    // Two processes recovering at the same moment: the claim lets only one of them have the task.
    it("hands a task to only one of two processes recovering at once", async () => {
        const tasks = [createTask("task-1")];
        const a = createRecovery([{ id: "root", tasks }]);
        const b = createRecovery([{ id: "root", tasks }], a.shared);

        await Promise.all([a.recover(), b.recover()]);

        expect(a.start.mock.calls.length + b.start.mock.calls.length).toBe(1);
    });

    // A task just triggered is pending and unclaimed until its loop's first iteration claims it.
    it("leaves a pending task saved within the grace period alone", async () => {
        const savedOn = new Date().toISOString();
        const tasks = [createTask("fresh", { taskStatus: TaskDataStatus.PENDING, savedOn })];
        const { recover, start } = createRecovery([{ id: "root", tasks }]);

        await recover();

        expect(start).not.toHaveBeenCalled();
    });

    // A task handed back at shutdown: it saved, then its claim was released.
    it("takes a running task nobody holds at once, however recently it saved", async () => {
        const savedOn = new Date().toISOString();
        const tasks = [createTask("handed-back", { taskStatus: TaskDataStatus.RUNNING, savedOn })];
        const { recover, start } = createRecovery([{ id: "root", tasks }]);

        const result = await recover();

        expect(result.resumed).toBe(1);
        expect(start).toHaveBeenCalledWith(
            expect.objectContaining({ webinyTaskId: "handed-back" })
        );
    });

    it(`fails a task taken over more than ${MAX_RECOVERIES} times without saving`, async () => {
        const tasks = [createTask("crashy")];
        const first = createRecovery([{ id: "root", tasks }]);
        const target = { tenant: "root", taskId: "crashy" };

        // Each round, the process that took the task dies: its claim is gone, the count stays.
        for (let round = 0; round < MAX_RECOVERIES; round++) {
            await first.recover();
            first.shared.records.delete(`background-tasks/claims:root/crashy`);
        }
        expect(first.start).toHaveBeenCalledTimes(MAX_RECOVERIES);

        const result = await first.recover();

        expect(result).toEqual({ resumed: 0, failed: 1, failedTenants: [] });
        expect(first.start).toHaveBeenCalledTimes(MAX_RECOVERIES);
        expect(first.updateTask).toHaveBeenCalledWith(
            "crashy",
            expect.objectContaining({ taskStatus: TaskDataStatus.FAILED })
        );
        // Released, so nothing holds a task that is finished.
        expect(await first.claim.take(target, TTL_MS)).toBe(true);
    });

    // A long task interrupted by one redeploy after another, saving in between: never failed.
    it("keeps resuming a task that saves between takeovers", async () => {
        const task = createTask("long");
        const recovery = createRecovery([{ id: "root", tasks: [task] }]);
        const rounds = MAX_RECOVERIES + 2;

        for (let round = 0; round < rounds; round++) {
            await recovery.recover();
            recovery.shared.records.delete(`background-tasks/claims:root/long`);
            // It saved before its process went down: a different savedOn each round.
            const savedAtMs = Date.now() - round * 1000;
            const savedAt = new Date(savedAtMs);
            task.savedOn = savedAt.toISOString();
        }

        expect(recovery.start).toHaveBeenCalledTimes(rounds);
        expect(recovery.updateTask).not.toHaveBeenCalled();
    });

    // A claim taken now would only keep the task from the next owner until it runs out.
    it("takes nothing once the process is shutting down", async () => {
        const tasks = [createTask("task-1")];
        const { recover, start, claim, shutdown } = createRecovery([{ id: "root", tasks }]);
        shutdown.begin();

        const result = await recover();

        expect(result.resumed).toBe(0);
        expect(start).not.toHaveBeenCalled();
        expect(await claim.take({ tenant: "root", taskId: "task-1" }, TTL_MS)).toBe(true);
    });

    it("skips tenants that are disabled or not installed", async () => {
        const { recover, start } = createRecovery([
            { id: "off", status: "disabled", tasks: [createTask("a")] },
            { id: "new", isInstalled: false, tasks: [createTask("b")] }
        ]);

        await recover();

        expect(start).not.toHaveBeenCalled();
    });

    it("still recovers the other tenants when one fails", async () => {
        const { recover, start } = createRecovery([
            { id: "broken", broken: true },
            { id: "acme", tasks: [createTask("task-1")] }
        ]);

        const result = await recover();

        expect(result).toEqual({ resumed: 1, failed: 0, failedTenants: ["broken"] });
        expect(start).toHaveBeenCalledWith(expect.objectContaining({ tenant: "acme" }));
    });
});
