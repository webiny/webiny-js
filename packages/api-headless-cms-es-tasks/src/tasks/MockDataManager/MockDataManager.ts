import { TaskDataStatus } from "@webiny/tasks";
import type {
    IMockDataManagerInput,
    IMockDataManagerOutput
} from "~/tasks/MockDataManager/types.js";
import { calculateAmounts } from "./calculateAmounts.js";
import type { IMockDataCreatorInput } from "~/tasks/MockDataCreator/types.js";
import { calculateSeconds, WAIT_MAX_SECONDS } from "./calculateSeconds.js";
import { createModelAndGroup } from "~/tasks/MockDataManager/createModelAndGroup.js";
import type { Context } from "~/types.js";
import { disableIndexing, enableIndexing } from "~/utils/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { MOCK_DATA_CREATOR_TASK_ID } from "~/tasks/MockDataCreatorTask.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export class MockDataManager<I extends IMockDataManagerInput, O extends IMockDataManagerOutput> {
    constructor(private context: Context) {}

    public async execute(
        params: TaskDefinition.RunParams<I, O>
    ): Promise<TaskDefinition.Result<I, O>> {
        const { input, controller } = params;

        const taskId = controller.state.getTask().id;
        if (controller.runtime.isAborted()) {
            await this.abortChildTasks(this.context, taskId);
            return controller.response.aborted();
        } else if (input.seconds) {
            const items = await this.listChildTasksNotDone(this.context, taskId);

            /**
             * If there are still running creator tasks, we need to wait a bit more.
             */
            if (items.length > 0) {
                return controller.response.continue(
                    {
                        ...input
                    },
                    {
                        seconds: input.seconds || WAIT_MAX_SECONDS
                    }
                );
            }
            /**
             * If there are no running tasks, we can enable indexing and finish the manager task.
             */
            await enableIndexing({
                client: this.context.opensearch,
                model: {
                    modelId: input.modelId,
                    tenant: "root"
                }
            });
            return controller.response.done();
        }

        const result = await createModelAndGroup({
            context: this.context,
            modelId: input.modelId,
            overwrite: input.overwrite
        });
        if (typeof result === "string") {
            return controller.response.done(result);
        }

        await disableIndexing({
            model: result.model,
            client: this.context.opensearch
        });

        const { amountOfTasks, amountOfRecords } = calculateAmounts(input.amount);

        const seconds = calculateSeconds(amountOfRecords);

        for (let current = 0; current < amountOfTasks; current++) {
            await controller.task.trigger<IMockDataCreatorInput>({
                definition: MOCK_DATA_CREATOR_TASK_ID,
                input: {
                    totalAmount: amountOfRecords,
                    createdAmount: 0
                },
                name: `Mock Data Creator Task #${current + 1} of ${amountOfTasks}`
            });
        }

        return controller.response.continue(
            {
                ...input,
                seconds,
                amountOfTasks,
                amountOfRecords
            },
            {
                seconds
            }
        );
    }

    private async listChildTasksNotDone(context: Context, id: string): Promise<TaskService.Task[]> {
        const { items } = await context.tasks.listTasks({
            where: {
                parentId: id,
                taskStatus_in: [TaskDataStatus.PENDING, TaskDataStatus.RUNNING]
            },
            limit: 10000
        });
        return items;
    }

    private async abortChildTasks(context: Context, id: string): Promise<void> {
        const items = await this.listChildTasksNotDone(context, id);
        for (const item of items) {
            await context.tasks.abort({
                id: item.id,
                message: "Aborted by parent task."
            });
        }
    }
}
