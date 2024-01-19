import {
    IExportPagesCombineZippedPagesInput,
    IExportPagesCombineZippedPagesTaskParams,
    IExportPagesZipPagesDone,
    IExportPagesZipPagesOutput,
    PageExportTask
} from "~/export/pages/types";
import { IListTaskParams, IListTasksResponse, ITaskResponseResult } from "@webiny/tasks";

export class CombineZippedPages {
    public async execute(
        params: IExportPagesCombineZippedPagesTaskParams
    ): Promise<ITaskResponseResult> {
        const { response, context, store, isCloseToTimeout, isAborted } = params;

        /**
         * We need to get all the subtasks of the PageExportTask.ZipPages type, so we can get all the zip files and combine them into one.
         * Current task must have a parent for this to work.
         */
        const parentId = store.getTask().parentId;
        if (!parentId) {
            return response.error({
                message: `Could not find parent task ID.`
            });
        }
        const listSubtasksParams: IListTaskParams = {
            where: {
                parent: parentId,
                definitionId: PageExportTask.ZipPages
            },
            after: undefined,
            limit: 100
        };

        let result: IListTasksResponse<
            IExportPagesCombineZippedPagesInput,
            IExportPagesZipPagesOutput
        >;
        const done: IExportPagesZipPagesDone = {};
        while ((result = await context.tasks.listTasks(listSubtasksParams))) {
            if (isAborted()) {
                return response.aborted();
            }
            const { items, meta } = result;
            for (const item of items) {
                if (!item.output?.done) {
                    continue;
                }
                Object.assign(done, item.output.done);
            }
            if (!meta.hasMoreItems) {
                break;
            }
            listSubtasksParams.after = meta.cursor;
        }
        /**
         * When we have all the pages IDs and their zip files, we can continue to combine the zip files into one.
         */
        const pages = Object.keys(done);
        const files = Object.values(done);

        return response.continue({});
    }
}
