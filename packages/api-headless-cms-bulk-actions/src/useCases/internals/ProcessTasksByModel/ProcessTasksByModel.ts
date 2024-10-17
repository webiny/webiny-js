import { TaskDataStatus } from "@webiny/tasks";
import { BulkActionOperationByModelAction, IBulkActionOperationByModelTaskParams } from "~/types";

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
                    ...input,
                    action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                });
            }

            const { items } = await context.tasks.listTasks({
                where: {
                    parentId: store.getTask().id,
                    definitionId: this.taskDefinition,
                    taskStatus_in: [TaskDataStatus.RUNNING, TaskDataStatus.PENDING]
                },
                limit: 1
            });

            // If there are running or pending tasks, continue with a wait.
            if (items.length > 0) {
                return response.continue(
                    {
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    },
                    {
                        seconds: 120
                    }
                );
            }

            return response.continue({
                ...input,
                action: BulkActionOperationByModelAction.CHECK_MORE_SUBTASKS
            });
        } catch (ex) {
            return response.error(
                ex.message ?? `Error while processing task "${this.taskDefinition}"`
            );
        }
    }
}
