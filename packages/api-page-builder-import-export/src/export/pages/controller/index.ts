import { ITaskResponseResult } from "@webiny/tasks";
import { IExportPagesControllerTaskParams } from "../types";
import { processZipPagesTasks } from "./processZipPagesTasks";
import { processCombineZippedPagesTask } from "./processCombineZippedPagesTask";
import { createZipPagesTasks } from "./createZipPagesTasks";

export const exportPagesController = async (
    params: IExportPagesControllerTaskParams
): Promise<ITaskResponseResult> => {
    const { input } = params;
    /**
     * In case subtasks for zipping pages are already created, we need to wait for them to finish.
     * After they are done, we can create a new task which will zip all zipped pages.
     */
    if (input.processing && !input.combining) {
        return await processZipPagesTasks(params);
    }
    /**
     * In case of combining zipped pages, we need to check if task is done and mark the controller task as done.
     */
    //
    else if (input.combining) {
        return await processCombineZippedPagesTask(params);
    }
    /**
     * On the first run of the task, we need to create subtasks for zipping pages in batches.
     */
    return await createZipPagesTasks(params);
};
