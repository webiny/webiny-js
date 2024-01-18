import {
    CreateZipPagesTasks,
    ProcessCombineZippedPagesTask,
    ProcessZipPagesTasks
} from "./controller";
import { IExportPagesControllerTaskParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";

export class ExportPagesController {
    public async execute(params: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { input } = params;
        /**
         * In case subtasks for zipping pages are already created, we need to wait for them to finish.
         * After they are done, we can create a new task which will zip all zipped pages.
         */
        if (input.processing && !input.combining) {
            const processZipPagesTasks = new ProcessZipPagesTasks();
            return await processZipPagesTasks.execute(params);
        }
        /**
         * In case of combining zipped pages, we need to check if task is done and mark the controller task as done.
         */
        //
        else if (input.combining) {
            const processCombineZippedPagesTask = new ProcessCombineZippedPagesTask();
            return await processCombineZippedPagesTask.execute(params);
        }
        /**
         * On the first run of the task, we need to create subtasks for zipping pages in batches.
         */
        const createZipPagesTasks = new CreateZipPagesTasks();
        return await createZipPagesTasks.execute(params);
    }
}
