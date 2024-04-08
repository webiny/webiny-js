import { ITaskResponseResult } from "@webiny/tasks";

import { ProcessDeleteEntriesTasks } from "./ProcessDeleteEntriesTasks";
import { CreateDeleteEntriesTasks } from "./CreateDeleteEntriesTasks";

import { IEmptyTrashBinByModelTaskParams } from "~/types";

export class EmptyTrashBinByModel {
    public async execute(params: IEmptyTrashBinByModelTaskParams): Promise<ITaskResponseResult> {
        const { input } = params;

        /**
         * In case subtasks for zipping pages are already created, we need to wait for them to finish.
         * After they are done, we can combine all zip files into a single one.
         */
        if (input.processing) {
            const processDeleteEntriesTasks = new ProcessDeleteEntriesTasks();
            return await processDeleteEntriesTasks.execute(params);
        }
        /**
         * On the first run of the task, we need to create subtasks for zipping pages in batches.
         */
        const createDeleteEntriesTasks = new CreateDeleteEntriesTasks();
        return await createDeleteEntriesTasks.execute(params);
    }
}
