import { ITaskResponseResult, TaskDataStatus } from "@webiny/tasks";
import { IExportPagesControllerTaskParams, PageExportTask } from "../types";
import { CombineZippedPages } from "~/export/pages/controller/CombineZippedPages";

export const ZIP_PAGES_WAIT_TIME = 5;

export class ProcessZipPagesTasks {
    public async execute(params: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

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
                taskStatus_in: [TaskDataStatus.RUNNING, TaskDataStatus.PENDING]
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
         * If all subtasks (Zip Pages) are done, we can continue with zipping all zip files into a single one.
         */
        const combineZippedPages = new CombineZippedPages();

        return combineZippedPages.execute({
            store,
            response
        });
    }
}
