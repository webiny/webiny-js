import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";

export const WAITING_TIME = 10;

export class ProcessTasks {
    public async execute(
        params: IBulkActionOperationByModelTaskParams
    ): Promise<ITaskResponseResult> {
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
                    definitionId: EntriesTask.MoveEntriesToFolder,
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
                `Task done: entries from "${input.modelId}" model has been moved to a different folder.`
            );
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing MoveEntriesToFolderByModel/ProcessTasks"
            );
        }
    }
}
