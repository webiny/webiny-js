import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { BackgroundTasksLoop } from "~/domain/BackgroundTasksLoop.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { CLAIM_TTL_MS } from "~/claim/constants.js";

/**
 * Starts a triggered task in this process. Builds the same event Step Functions would deliver on
 * AWS and hands it to the task loop. `endpoint`, `executionName` and `stateMachineId` only satisfy
 * the runner's event validation; nothing reads them off AWS.
 *
 * The task is claimed here, before the loop starts it, with the trigger's delay in the claim's
 * expiry. The delay is not stored on the task, so without this a process that died before the first
 * iteration would take the delay with it, and recovery elsewhere would run the task early.
 */
class InProcessTaskServiceImpl implements TaskService.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly tasksLoop: BackgroundTasksLoop.Interface,
        private readonly claim: TaskClaim.Interface,
        private readonly logger: Logger.Interface
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

        await this.claimUntilDue(tenant.id, task.id, delay);
        this.tasksLoop.start(event);

        return { taskId: task.id };
    }

    /*
     * A claim that cannot be written is left to the first iteration, which takes it as it did before.
     * The trigger still succeeds: the task is already stored, and failing here would only lose it.
     */
    private async claimUntilDue(tenant: string, taskId: string, delay: number): Promise<void> {
        const target: TaskClaim.Target = { tenant, taskId };
        const delayMs = Math.max(delay, 0) * 1000;
        try {
            await this.claim.take(target, CLAIM_TTL_MS + delayMs);
        } catch (error) {
            this.logger.warn({ error, ...target }, "Could not claim a triggered background task.");
        }
    }

    public async fetch(): Promise<null> {
        // A running task has no execution record outside the task itself.
        return null;
    }
}

export const InProcessTaskService = TaskService.createImplementation({
    implementation: InProcessTaskServiceImpl,
    dependencies: [TenantContext, BackgroundTasksLoop, TaskClaim, Logger]
});
