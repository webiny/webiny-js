import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { BackgroundTasksLoop } from "~/domain/BackgroundTasksLoop.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { RandomProcessOwner } from "~/claim/RandomProcessOwner.js";
import { KeyValueTaskClaim } from "~/claim/KeyValueTaskClaim.js";
import { CLAIM_TTL_MS } from "~/claim/constants.js";
import { InProcessTaskService } from "~/service/InProcessTaskService.js";
import { createMemoryKeyValueStore } from "./helpers/createMemoryKeyValueStore.js";

const target = { tenant: "root", taskId: "task-1" };

const createService = (tenantId: string | null, options: { claim?: TaskClaim.Interface } = {}) => {
    const start = vi.fn();
    const warn = vi.fn();
    const tenantContext = {
        getTenant: () => {
            if (!tenantId) {
                return null;
            }
            return { id: tenantId };
        }
    } as unknown as TenantContext.Interface;
    const { store, records } = createMemoryKeyValueStore();

    const container = new Container();
    container.registerInstance(TenantContext, tenantContext);
    container.registerInstance(BackgroundTasksLoop, { start, stop: vi.fn() });
    container.registerInstance(GlobalKeyValueStore, store);
    container.registerInstance(Logger, { warn } as unknown as Logger.Interface);
    container.register(RandomProcessOwner).inSingletonScope();
    if (options.claim) {
        container.registerInstance(TaskClaim, options.claim);
    } else {
        container.register(KeyValueTaskClaim);
    }
    container.register(InProcessTaskService);

    // A second process on the same store, to see whether the task is taken.
    const other = new Container();
    other.registerInstance(GlobalKeyValueStore, store);
    other.register(RandomProcessOwner).inSingletonScope();
    other.register(KeyValueTaskClaim);

    const service = container.resolve(TaskService);
    return { service, start, warn, records, otherClaim: other.resolve(TaskClaim) };
};

afterEach(() => {
    vi.useRealTimers();
});

describe("InProcessTaskService", () => {
    it("hands the task to the loop as a background task event", async () => {
        const { service, start } = createService("root");

        const result = await service.send({ id: "task-1", definitionId: "testDef" }, 60);

        expect(result).toEqual({ taskId: "task-1" });
        expect(start).toHaveBeenCalledWith({
            webinyTaskId: "task-1",
            webinyTaskDefinitionId: "testDef",
            tenant: "root",
            delay: 60,
            endpoint: "in-process",
            executionName: "task-1",
            stateMachineId: ""
        });
    });

    it("starts nothing without a tenant", async () => {
        const { service, start } = createService(null);

        const result = await service.send({ id: "task-1", definitionId: "testDef" }, 0);

        expect(result).toBeNull();
        expect(start).not.toHaveBeenCalled();
    });

    /*
     * The delay lives only in the event, so the claim carries it: if this process dies before the
     * first iteration, nobody else takes the task before it is due.
     */
    it("claims the task until its delay and one TTL are up", async () => {
        vi.useFakeTimers();
        const { service, otherClaim } = createService("root");

        await service.send({ id: "task-1", definitionId: "testDef" }, 300);

        vi.advanceTimersByTime(300_000 + CLAIM_TTL_MS - 1000);
        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(false);

        vi.advanceTimersByTime(2000);
        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
    });

    it("claims a task without a delay for one TTL", async () => {
        vi.useFakeTimers();
        const { service, otherClaim } = createService("root");

        await service.send({ id: "task-1", definitionId: "testDef" }, 0);

        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(false);
        vi.advanceTimersByTime(CLAIM_TTL_MS + 1);
        expect(await otherClaim.take(target, CLAIM_TTL_MS)).toBe(true);
    });

    // The first iteration takes the claim then, as it did before the trigger claimed.
    it("still starts the task when the claim cannot be written", async () => {
        const claim = {
            take: vi.fn(async () => {
                throw new Error("storage unavailable");
            })
        } as unknown as TaskClaim.Interface;
        const { service, start, warn } = createService("root", { claim });

        const result = await service.send({ id: "task-1", definitionId: "testDef" }, 0);

        expect(result).toEqual({ taskId: "task-1" });
        expect(start).toHaveBeenCalled();
        expect(warn).toHaveBeenCalled();
    });
});
