import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { TaskLoop } from "~/domain/TaskLoop.js";
import { InProcessTaskService } from "~/service/InProcessTaskService.js";

const createService = (tenantId: string | null) => {
    const start = vi.fn();
    const tenantContext = {
        getTenant: () => {
            if (!tenantId) {
                return null;
            }
            return { id: tenantId };
        }
    } as unknown as TenantContext.Interface;

    const container = new Container();
    container.registerInstance(TenantContext, tenantContext);
    container.registerInstance(TaskLoop, { start });
    container.register(InProcessTaskService);
    const service = container.resolve(TaskService);

    return { service, start };
};

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
});
