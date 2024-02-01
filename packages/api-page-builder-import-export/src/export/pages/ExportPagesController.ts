import { IExportPagesControllerTaskParams } from "./types";
import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessZipPagesTasks } from "./controller/ProcessZipPagesTasks";
import { CreateZipPagesTasks } from "./controller/CreateZipPagesTasks";

export class ExportPagesController {
    public async execute(params: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const { input } = params;
        /**
         * In case subtasks for zipping pages are already created, we need to wait for them to finish.
         * After they are done, we can combine all zip files into a single one.
         */
        if (input.zippingPages) {
            const processZipPagesTasks = new ProcessZipPagesTasks();
            return await processZipPagesTasks.execute(params);
        }
        /**
         * On the first run of the task, we need to create subtasks for zipping pages in batches.
         */
        const createZipPagesTasks = new CreateZipPagesTasks();
        return await createZipPagesTasks.execute(params);
    }
}
