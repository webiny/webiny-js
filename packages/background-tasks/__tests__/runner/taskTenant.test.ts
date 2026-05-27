import { describe, it, expect } from "vitest";
import { createMockEvent } from "~tests/mocks";
import { createLiveContextFactory } from "~tests/live";
import { useTaskHandler } from "~tests/helpers/useTaskHandler";

import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { createContextPlugin } from "@webiny/api";

const TASK_ID = "taskRunnerTask";

class TestingRunTask implements TaskDefinition.Interface {
    id = TASK_ID;
    title = "Task Runner Task";
    constructor(
        private controller: TaskController.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async run() {
        return this.controller.response.done("Task is done!", {
            tenant: this.tenantContext.getTenant().id
        });
    }
}

const TestingRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: TestingRunTask,
    dependencies: [TaskController, TenantContext]
});

const defaults = {
    tenant: "aCustomTenantId"
};

describe("task tenant", () => {
    it("should properly set the tenant", async () => {
        const contextFactory = createLiveContextFactory({
            plugins: [
                createContextPlugin(context => {
                    context.container.register(TestingRunTaskDefinition);
                })
            ]
        });

        const context = await contextFactory({
            headers: {
                ["x-tenant"]: defaults.tenant,
                ["x-webiny-cms-endpoint"]: "manage"
            }
        });

        const task = await context.tasks.createTask({
            definitionId: TASK_ID,
            input: {},
            name: "My task name"
        });

        const { handle } = useTaskHandler({
            plugins: [
                createContextPlugin(context => {
                    context.container.register(TestingRunTaskDefinition);
                })
            ]
        });

        const result = await handle(
            createMockEvent({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: TASK_ID,
                tenant: defaults.tenant
            })
        );

        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: TASK_ID,
            tenant: "aCustomTenantId",
            message: "Task is done!",
            output: {
                tenant: "aCustomTenantId"
            }
        });
    });
});
