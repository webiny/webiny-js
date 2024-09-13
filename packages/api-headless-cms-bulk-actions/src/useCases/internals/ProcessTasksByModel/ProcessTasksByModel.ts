import { TaskDataStatus } from "@webiny/tasks";
import { IBulkActionOperationByModelTaskParams } from "~/types";

const WAITING_TIME = 10;

/**
 * The `ProcessTasksByModel` class is responsible for processing tasks for a specific model.
 * It checks for any running or pending tasks from the parent task and continues or completes
 * the task based on the status.
 */
export class ProcessTasksByModel {
    private taskDefinition: string;

    constructor(taskDefinition: string) {
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

            // If there are running or pending tasks, continue with a wait.
            if (result.items.length > 0) {
                console.log(
                    "ProcessTasksByModel",
                    "response.continue -> result.items.length > 0",
                    result.meta.totalCount
                );
                return response.continue(
                    {
                        ...input
                    },
                    {
                        seconds: WAITING_TIME
                    }
                );
            }

            console.log("ProcessTasksByModel", "end of the code");
            return response.continue({ ...input, processing: false, creating: true });
        } catch (ex) {
            return response.error(
                ex.message ?? `Error while processing task "${this.taskDefinition}"`
            );
        }
    }
}
