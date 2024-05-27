import { ITask, ITaskResponseResult, ITaskRunParams, TaskDataStatus } from "@webiny/tasks";
import { IMockDataManagerInput, IMockDataManagerOutput } from "~/tasks/MockDataManager/types";
import { calculateAmounts } from "./calculateAmounts";
import { IMockDataCreatorInput } from "~/tasks/MockDataCreator/types";
import { calculateSeconds, WAIT_MAX_SECONDS } from "./calculateSeconds";
import { MOCK_DATA_CREATOR_TASK_ID } from "~/tasks/createMockDataCreatorTask";
import { createModelAndGroup } from "~/tasks/MockDataManager/createModelAndGroup";
import { Context } from "~/types";
import { disableIndexing, enableIndexing } from "~/utils";

export class MockDataManager<
    C extends Context,
    I extends IMockDataManagerInput,
    O extends IMockDataManagerOutput
> {
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, isAborted, input, response, trigger, store } = params;

        const taskId = store.getTask().id;
        if (isAborted()) {
            await this.abortChildTasks(context, taskId);
            return response.aborted();
        } else if (input.seconds) {
            const items = await this.listChildTasks(context, taskId);
            /**
             * If there are no running tasks, we can enable indexing and finish the manager task.
             */
            if (items.length === 0) {
                await enableIndexing({
                    client: context.elasticsearch,
                    model: {
                        modelId: input.modelId,
                        tenant: "root",
                        locale: "en-US"
                    }
                });
                return response.done();
            }
            /**
             * If there are still running creator tasks, we need to wait a bit more.
             */
            for (const item of items) {
                if (
                    item.taskStatus === TaskDataStatus.RUNNING ||
                    item.taskStatus === TaskDataStatus.PENDING
                ) {
                    return response.continue(
                        {
                            ...input
                        },
                        {
                            seconds: input.seconds || WAIT_MAX_SECONDS
                        }
                    );
                }
            }
        }

        const result = await createModelAndGroup({
            context,
            modelId: input.modelId,
            overwrite: input.overwrite
        });
        if (typeof result === "string") {
            return response.done(result);
        }

        await disableIndexing({
            model: result.model,
            client: context.elasticsearch
        });

        const { amountOfTasks, amountOfRecords } = calculateAmounts(input.amount);

        const seconds = calculateSeconds(amountOfRecords);

        for (let current = 0; current < amountOfTasks; current++) {
            await trigger<IMockDataCreatorInput>({
                definition: MOCK_DATA_CREATOR_TASK_ID,
                input: {
                    totalAmount: amountOfRecords,
                    createdAmount: 0
                },
                name: `Mock Data Creator Task #${current + 1} of ${amountOfTasks}`
            });
        }

        return response.continue(
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

    private async listChildTasks(context: Context, id: string): Promise<ITask[]> {
        const { items } = await context.tasks.listTasks({
            where: {
                parentId: id
            },
            limit: 10000
        });
        return items;
    }

    private async abortChildTasks(context: Context, id: string): Promise<void> {
        const items = await this.listChildTasks(context, id);
        for (const item of items) {
            await context.tasks.abort({
                id: item.id,
                message: "Aborted by parent task."
            });
        }
    }
}
