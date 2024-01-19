import { IExportPagesControllerTaskParams } from "../types";
import { ITaskResponseResult } from "@webiny/tasks";

export const COMBINE_ZIPPED_PAGES_WAIT_TIME = 30;

export class ProcessCombineZippedPagesTask {
    public async execute(params: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, input, context } = params;
        /**
         * We can safely case as string, because we know that we are passing the ID of the zipping task.
         */
        const task = await context.tasks.getTask(input.combiningZips as string);
        if (!task) {
            return response.error({
                message: `Cannot find task with ID "${input.combiningZips}".`,
                code: "TASK_NOT_FOUND"
            });
        } else if (task.taskStatus === "running" || task.taskStatus === "pending") {
            return response.continue(
                {
                    ...input
                },
                {
                    seconds: COMBINE_ZIPPED_PAGES_WAIT_TIME
                }
            );
        } else if (task.taskStatus === "failed") {
            return response.error({
                message: `Zipping task "${task.id}" failed.`,
                code: "ZIP_ERROR"
            });
        } else if (task.taskStatus === "aborted") {
            return response.aborted();
        }
        return response.done("Zipping done.", {
            ...task.output
        });
    }
}
