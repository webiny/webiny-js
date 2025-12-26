import { TaskDataStatus } from "@webiny/tasks";
import type { IBulkActionOperationByModelTaskParams } from "~/types.js";
import { BulkActionOperationByModelAction } from "~/types.js";
import { BulkActionContext } from "~/features/BulkActionContext/index.js";

/**
 * The `ProcessTasksByModel` class is responsible for processing tasks for a specific model.
 * It checks for any running or pending tasks from the parent task and continues or completes
 * the task based on the status.
 */
export class ProcessTasksByModel {
    private context: BulkActionContext.Interface;
    private readonly taskDefinition: string;

    constructor(context: BulkActionContext.Interface, taskDefinition: string) {
        this.context = context;
        this.taskDefinition = taskDefinition;
    }

    async execute({ input, controller }: IBulkActionOperationByModelTaskParams) {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            } else if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue({
                    ...input,
                    action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                });
            }

            const { items } = await this.context.tasks.listTasks({
                where: {
                    parentId: controller.state.getTask().id,
                    definitionId: this.taskDefinition,
                    taskStatus_in: [TaskDataStatus.RUNNING, TaskDataStatus.PENDING]
                },
                limit: 1
            });

            // If there are running or pending tasks, continue with a wait.
            if (items.length > 0) {
                return controller.response.continue(
                    {
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    },
                    {
                        seconds: 120
                    }
                );
            }

            return controller.response.continue({
                ...input,
                action: BulkActionOperationByModelAction.CHECK_MORE_SUBTASKS
            });
        } catch (ex) {
            return controller.response.error(
                ex.message ?? `Error while processing task "${this.taskDefinition}"`
            );
        }
    }
}
