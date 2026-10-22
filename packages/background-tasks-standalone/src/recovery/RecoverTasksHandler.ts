import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ListTasksUseCase } from "@webiny/background-tasks/api/features/ListTasks/index.js";
import { UpdateTaskUseCase } from "@webiny/background-tasks/api/features/UpdateTask/index.js";
import { TaskDataStatus } from "@webiny/background-tasks/api/types.js";
import type { ITask } from "@webiny/background-tasks/api/types.js";
import { TaskLoop } from "~/domain/TaskLoop.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { TaskRecoveries } from "~/domain/TaskRecoveries.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { CLAIM_TTL_MS } from "~/claim/constants.js";
import { MAX_RECOVERIES } from "~/claim/constants.js";
import { RECOVER_GRACE_MS } from "~/claim/constants.js";
import { TaskRecoverEventHandler } from "./TaskRecoverEventHandler.js";

// Unfinished tasks read per page.
const PAGE_SIZE = 100;

type Outcome = "resumed" | "failed" | "skipped";

// Same reasoning as the scheduler's recovery: not installed has no tasks, disabled must not run them.
function canRecover(tenant: Tenant): boolean {
    return tenant.isInstalled && tenant.status !== "disabled";
}

/*
 * Only a pending task gets the grace period: it can be unclaimed for a moment after its trigger
 * created it. A running task always has a claim while its process lives, so one without a claim is
 * free to take, however recently it saved. A task handed back at shutdown saved moments before its
 * claim was released, and would otherwise wait out the grace period.
 */
function isJustTriggered(task: ITask): boolean {
    if (task.taskStatus !== TaskDataStatus.PENDING) {
        return false;
    }
    const savedAt = Date.parse(task.savedOn);
    return savedAt > Date.now() - RECOVER_GRACE_MS;
}

// The event a trigger would have sent, without its delay: a task found here is due already.
function toEvent(task: ITask, tenant: string): IBackgroundTaskEvent {
    return {
        webinyTaskId: task.id,
        webinyTaskDefinitionId: task.definitionId,
        tenant,
        delay: 0,
        endpoint: "in-process",
        executionName: task.executionName || task.id,
        stateMachineId: ""
    };
}

/**
 * Takes over every unfinished task that no process holds: those of a process that died or was
 * replaced, and any that were triggered but never started. Pending and running tasks alike are
 * resumed from their last saved state, the way the next iteration would have continued them.
 *
 * A running task is resumed rather than failed because a redeploy kills healthy work, and the runner
 * picks it up where its last iteration saved it. Work an iteration did after that save runs again,
 * so a task must cope with an iteration being repeated.
 *
 * Each time recovery picks a task up, it counts that, and the count starts over whenever the task
 * has saved since the last pick-up. A task picked up more than `MAX_RECOVERIES` times without saving
 * in between is marked failed instead of resumed. This is for a task that takes the server down
 * itself, say by running out of memory: resumed after every restart, it would crash the server again
 * each time, and the server would never stay up. A long task that keeps saving survives any number
 * of redeploys.
 */
class RecoverTasksHandlerImpl implements TaskRecoverEventHandler.Interface {
    public constructor(
        private readonly listTenants: ListTenantsUseCase.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTasks: ListTasksUseCase.Interface,
        private readonly updateTask: UpdateTaskUseCase.Interface,
        private readonly claim: TaskClaim.Interface,
        private readonly recoveries: TaskRecoveries.Interface,
        private readonly taskLoop: TaskLoop.Interface,
        private readonly shutdown: ShutdownSignal.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute(): Promise<TaskRecoverEventHandler.Result> {
        const tenantsResult = await this.listTenants.execute();
        if (tenantsResult.isFail()) {
            throw tenantsResult.error;
        }

        const result: TaskRecoverEventHandler.Result = { resumed: 0, failed: 0, failedTenants: [] };

        for (const tenant of tenantsResult.value) {
            if (!canRecover(tenant)) {
                continue;
            }
            try {
                await this.recoverTenant(tenant, result);
            } catch (error) {
                result.failedTenants.push(tenant.id);
                this.logger.error(
                    { error, tenant: tenant.id },
                    "Could not recover the tenant's background tasks."
                );
            }
        }

        if (result.resumed > 0 || result.failed > 0) {
            this.logger.info(
                { resumed: result.resumed, failed: result.failed },
                "Recovered background tasks that no process held."
            );
        }
        return result;
    }

    private recoverTenant(tenant: Tenant, result: TaskRecoverEventHandler.Result): Promise<void> {
        // No `withoutAuthorization`: tasks are a private model, which no permission check applies to.
        return this.tenantContext.withTenant(tenant, () => {
            return this.recoverUnfinished(tenant.id, result);
        });
    }

    private async recoverUnfinished(
        tenant: string,
        result: TaskRecoverEventHandler.Result
    ): Promise<void> {
        let after: string | undefined;

        do {
            const listResult = await this.listTasks.execute({
                where: { taskStatus_in: [TaskDataStatus.PENDING, TaskDataStatus.RUNNING] },
                limit: PAGE_SIZE,
                after
            });
            if (listResult.isFail()) {
                throw listResult.error;
            }

            for (const task of listResult.value.items) {
                const outcome = await this.recoverTask(task, tenant);
                if (outcome === "resumed") {
                    result.resumed++;
                } else if (outcome === "failed") {
                    result.failed++;
                }
            }

            const { meta } = listResult.value;
            after = meta.hasMoreItems && meta.cursor ? meta.cursor : undefined;
        } while (after);
    }

    // One task that cannot be recovered is logged, and the rest of the page is still recovered.
    private async recoverTask(task: ITask, tenant: string): Promise<Outcome> {
        // A process that is stopping would only take a claim it cannot use, and delay the next owner.
        if (this.shutdown.isStopping() || isJustTriggered(task)) {
            return "skipped";
        }
        const target: TaskClaim.Target = { tenant, taskId: task.id };

        try {
            const taken = await this.claim.take(target, CLAIM_TTL_MS);
            if (!taken) {
                return "skipped";
            }

            const count = await this.recoveries.record(target, task.savedOn);
            if (count > MAX_RECOVERIES) {
                await this.fail(task, count);
                await this.claim.release(target);
                return "failed";
            }

            // The loop's first iteration finds the claim already this process's.
            const event = toEvent(task, tenant);
            this.taskLoop.start(event);
            return "resumed";
        } catch (error) {
            this.logger.error({ error, ...target }, "Could not recover a background task.");
            return "skipped";
        }
    }

    private async fail(task: ITask, count: number): Promise<void> {
        const finishedOn = new Date().toISOString();
        const result = await this.updateTask.execute(task.id, {
            taskStatus: TaskDataStatus.FAILED,
            finishedOn,
            output: {
                error: {
                    message: `The task stopped with its process ${count} times without saving any progress, so it was not resumed again.`,
                    code: "TASK_RECOVERY_LIMIT"
                }
            }
        });
        if (result.isFail()) {
            throw result.error;
        }
    }
}

export const RecoverTasksHandler = TaskRecoverEventHandler.createImplementation({
    implementation: RecoverTasksHandlerImpl,
    dependencies: [
        ListTenantsUseCase,
        TenantContext,
        ListTasksUseCase,
        UpdateTaskUseCase,
        TaskClaim,
        TaskRecoveries,
        TaskLoop,
        ShutdownSignal,
        Logger
    ]
});
