import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { DeleteEntriesTask, IDeleteEntriesControllerTaskParams } from "~/types";
import { DELETE_ENTRIES_WAIT_TIME } from "~/constants";

export class DeleteEntriesProcessEntriesChecker {
    public async execute(params: IDeleteEntriesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, context, store } = params;

        const { items } = await context.tasks.listTasks({
            where: {
                parentId: store.getTask().id,
                definitionId: DeleteEntriesTask.Process,
                taskStatus_in: [TaskDataStatus.RUNNING, TaskDataStatus.PENDING]
            },
            limit: 1
        });

        if (items.length > 0) {
            return response.continue(
                {
                    ...params.input
                },
                {
                    seconds: DELETE_ENTRIES_WAIT_TIME
                }
            );
        }

        return response.done("Done deleting entries", {
            totalEntries: store.getInput().totalEntries
        });
    }
}
