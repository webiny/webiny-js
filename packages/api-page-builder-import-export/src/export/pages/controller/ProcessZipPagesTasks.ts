import { IListTaskParams, IListTasksResponse, ITaskResponseResult } from "@webiny/tasks";
import { IExportPagesControllerTaskParams, PageExportTask } from "../types";
import { COMBINE_ZIPPED_PAGES_WAIT_TIME } from "~/export/pages/controller/ProcessCombineZippedPagesTask";

export const ZIP_PAGES_WAIT_TIME = 30;

export class ProcessZipPagesTasks {
    public async execute(params: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store, trigger } = params;

        /**
         * TODO: implement subtasks and subtask management into the base tasks package.
         */
        let result: IListTasksResponse;
        const listTasksParams: IListTaskParams = {
            where: {
                parent: store.getTask().id
            },
            limit: 100,
            after: undefined
        };
        while ((result = await context.tasks.listTasks(listTasksParams))) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue(input);
            }
            const { items, meta } = result;
            if (items.length === 0) {
                return response.done("No subtasks to verify.");
            }
            listTasksParams.after = meta.cursor;
            const unfinished = items.some(item => item.taskStatus === "running");
            if (unfinished) {
                return response.continue(
                    {
                        ...input
                    },
                    {
                        seconds: ZIP_PAGES_WAIT_TIME
                    }
                );
            }
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
                processing: false,
                combining: combineZippedPagesTask.id
            },
            {
                seconds: COMBINE_ZIPPED_PAGES_WAIT_TIME
            }
        );
    }
}
