import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { EntriesTask, IPublishEntriesByModelTaskParams } from "~/types";

export const WAITING_TIME = 10;

export class ProcessTasks {
    public async execute(params: IPublishEntriesByModelTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        try {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input
                });
            }

            const result = await context.tasks.listTasks({
                where: {
                    parentId: store.getTask().id,
                    definitionId: EntriesTask.PublishEntries,
                    taskStatus_in: [TaskDataStatus.RUNNING, TaskDataStatus.PENDING]
                },
                limit: 1
            });

            if (result.items.length > 0) {
                return response.continue(
                    {
                        ...input
                    },
                    {
                        seconds: WAITING_TIME
                    }
                );
            }

            return response.done(
                `Task done: all entries has been published for ${input.modelId} model.`
            );
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing PublishEntriesByModel/ProcessTasks"
            );
        }
    }
}
