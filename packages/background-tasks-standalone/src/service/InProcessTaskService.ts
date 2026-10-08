import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { TaskLoop } from "~/domain/TaskLoop.js";

/**
 * Starts a triggered task in this process. Builds the same event Step Functions would deliver on
 * AWS and hands it to the task loop. `endpoint`, `executionName` and `stateMachineId` only satisfy
 * the runner's event validation; nothing reads them off AWS.
 */
class InProcessTaskServiceImpl implements TaskService.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskLoop: TaskLoop.Interface
    ) {}

    public async send(task: TaskService.SendTaskParams, delay: number): Promise<unknown> {
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            return null;
        }

        const event: IBackgroundTaskEvent = {
            webinyTaskId: task.id,
            webinyTaskDefinitionId: task.definitionId,
            tenant: tenant.id,
            delay,
            endpoint: "in-process",
            executionName: task.id,
            stateMachineId: ""
        };

        this.taskLoop.start(event);

        return { taskId: task.id };
    }

    public async fetch(): Promise<null> {
        // A running task has no execution record outside the task itself.
        return null;
    }
}

export const InProcessTaskService = TaskService.createImplementation({
    implementation: InProcessTaskServiceImpl,
    dependencies: [TenantContext, TaskLoop]
});
