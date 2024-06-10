import { TaskDataStatus } from "@webiny/tasks";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";

const WAITING_TIME = 10;

export class TaskProcess {
    private taskDefinition: EntriesTask;

    constructor(taskDefinition: EntriesTask) {
        this.taskDefinition = taskDefinition;
    }

    async execute(params: IBulkActionOperationByModelTaskParams) {
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
                    definitionId: this.taskDefinition,
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
                `Task done: task "${this.taskDefinition}" has been successfully processed for entries from "${input.modelId}" model.`
            );
        } catch (ex) {
            return response.error(
                ex.message ?? `Error while processing task "${this.taskDefinition}"`
            );
        }
    }
}
