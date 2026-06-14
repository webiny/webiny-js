import Bree from "bree";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import type { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface IScheduledActionPollerParams {
    cronExpression: string;
    listScheduledActions: ListScheduledActionsUseCase.Interface;
    executeScheduledAction: ExecuteScheduledActionUseCase.Interface;
}

/* Polls the database for due scheduled actions and executes them. */
export class ScheduledActionPoller {
    private bree: Bree | undefined;

    public async start(params: IScheduledActionPollerParams): Promise<void> {
        const { cronExpression, listScheduledActions, executeScheduledAction } = params;

        this.bree = new Bree({
            root: false,
            jobs: [
                {
                    name: "poll-scheduled-actions",
                    cron: cronExpression,
                    path: join(__dirname, "jobs", "pollWorker.js")
                }
            ],
            logger: false
        });

        this.bree.on("worker message", async () => {
            await this.poll(listScheduledActions, executeScheduledAction);
        });

        await this.bree.start();
    }

    public async stop(): Promise<void> {
        if (this.bree) {
            await this.bree.stop();
            this.bree = undefined;
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
