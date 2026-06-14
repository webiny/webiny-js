import { schedule, type ScheduledTask } from "node-cron";
import type { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import type { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";

export interface IScheduledActionPollerParams {
    cronExpression: string;
    listScheduledActions: ListScheduledActionsUseCase.Interface;
    executeScheduledAction: ExecuteScheduledActionUseCase.Interface;
}

/* Polls the database for due scheduled actions and executes them. */
export class ScheduledActionPoller {
    private task: ScheduledTask | undefined;

    public start(params: IScheduledActionPollerParams): void {
        const { cronExpression, listScheduledActions, executeScheduledAction } = params;

        this.task = schedule(cronExpression, async () => {
            await this.poll(listScheduledActions, executeScheduledAction);
        });
    }

    public stop(): void {
        if (this.task) {
            this.task.stop();
            this.task = undefined;
        }
    }

    private async poll(
        listScheduledActions: ListScheduledActionsUseCase.Interface,
        executeScheduledAction: ExecuteScheduledActionUseCase.Interface
    ): Promise<void> {
        const now =
            new Date().toISOString() as `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

        const result = await listScheduledActions.execute({
            where: {
                scheduledFor_lte: now
            },
            limit: 100
        });

        if (result.isFail()) {
            console.error("Failed to poll scheduled actions:", result.error.message);
            return;
        }

        const { items } = result.value;

        for (const action of items) {
            const execResult = await executeScheduledAction.execute({
                id: action.id,
                namespace: action.namespace
            });

            if (execResult.isFail()) {
                console.error(
                    `Scheduled action "${action.id}" execution failed:`,
                    execResult.error.message
                );
            }
        }
    }
}
