import { TaskDataStatus } from "@webiny/tasks";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";

const WAITING_TIME = 10;

/**
 * Class representing a task processing operation.
 */
export class TaskProcess {
    private taskDefinition: EntriesTask;

    constructor(taskDefinition: EntriesTask) {
        this.taskDefinition = taskDefinition;
    }

    /**
     * Execute the task with given parameters.
     * @param {IBulkActionOperationByModelTaskParams} params - Parameters for executing the task.
     * @returns {Promise<void>} - A promise that resolves when the task execution is complete.
     */
    async execute(params: IBulkActionOperationByModelTaskParams) {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        try {
            // Check if the task has been aborted
            if (isAborted()) {
                return response.aborted();
            }
            // Check if the task is close to timing out
            else if (isCloseToTimeout()) {
                return response.continue({
                    ...input
                });
            }

            // Fetch tasks with the specified conditions
            const result = await context.tasks.listTasks({
                where: {
                    parentId: store.getTask().id,
                    definitionId: this.taskDefinition,
                    taskStatus_in: [TaskDataStatus.RUNNING, TaskDataStatus.PENDING]
                },
                limit: 1
            });

            // If there are running or pending tasks, continue with a wait
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

            // Task is successfully done
            return response.done(
                `Task done: task "${this.taskDefinition}" has been successfully processed for entries from "${input.modelId}" model.`
            );
        } catch (ex) {
            // Handle errors that occur during task processing
            return response.error(
                ex.message ?? `Error while processing task "${this.taskDefinition}"`
            );
        }
    }
}
