import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { IExportPagesControllerTaskParams, PageExportTask } from "../types";
import { COMBINE_ZIPPED_PAGES_WAIT_TIME } from "~/export/pages/controller/ProcessCombineZippedPagesTask";

export const ZIP_PAGES_WAIT_TIME = 15;

export class ProcessZipPagesTasks {
    public async execute(params: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store, trigger } = params;

        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue({
                ...input
            });
        }
        /**
         * TODO: implement subtasks and subtask management into the base tasks package.
         */
        const result = await context.tasks.listTasks({
            where: {
                parentId: store.getTask().id,
                definitionId: PageExportTask.ZipPages,
                taskStatus: TaskDataStatus.RUNNING
            },
            limit: 1
        });
        /**
         * Do we still need to wait until all subtasks (Zip Pages) are done?
         */
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
        /**
         * If all subtasks (Zip Pages) are done, we can continue with the next subtask (Combine Zipped Pages).
         */
        const combineZippedPagesTask = await trigger({
            definition: PageExportTask.CombineZippedPages
        });
        return response.continue(
            {
                ...input,
                zippingPages: false,
                combiningZips: combineZippedPagesTask.id
            },
            {
                seconds: COMBINE_ZIPPED_PAGES_WAIT_TIME
            }
        );
    }
}
