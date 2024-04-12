import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { EntriesTask, IEmptyTrashBinByModelTaskParams } from "~/types";

export const ZIP_PAGES_WAIT_TIME = 10;

export class ProcessDeleteEntriesTasks {
    public async execute(params: IEmptyTrashBinByModelTaskParams): Promise<ITaskResponseResult> {
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
                    definitionId: EntriesTask.DeleteTrashBinEntries,
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
                        seconds: ZIP_PAGES_WAIT_TIME
                    }
                );
            }

            return response.done(
                `Task done: The trash bin has been emptied for the ${input.modelId} model.`
            );
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing ProcessDeleteEntriesTasks");
        }
    }
}
