import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { EntriesTask, IDeleteEntriesByModelTaskParams } from "~/types";

const WAITING_TIME = 10;

export class ProcessTasks {
    public async execute(params: IDeleteEntriesByModelTaskParams): Promise<ITaskResponseResult> {
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
                    definitionId: EntriesTask.DeleteEntries,
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
                `Task done: entries from "${input.modelId}" model has been deleted.`
            );
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing DeleteEntriesByModel/ProcessTasks"
            );
        }
    }
}
