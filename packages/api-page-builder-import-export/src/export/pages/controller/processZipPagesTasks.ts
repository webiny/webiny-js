import { IListTaskParams, IListTasksResponse } from "@webiny/tasks";
import { IExportPagesControllerTaskParams, PageExportTask } from "../types";

export const ZIP_PAGES_WAIT_TIME = 30;

export const processZipPagesTasks = async (params: IExportPagesControllerTaskParams) => {
    const { response, input, isAborted, isCloseToTimeout, context, store } = params;

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
        } else if (!meta.hasMoreItems) {
            const combineZippedPagesTask = await context.tasks.trigger({
                parent: store.getTask(),
                definition: PageExportTask.CombineZippedPages
            });
            return response.continue({
                ...input,
                processing: false,
                combining: combineZippedPagesTask.id
            });
        }
    }
    return response.done("Subtasks done.");
};
