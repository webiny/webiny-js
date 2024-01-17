import { ListMeta, Page } from "@webiny/api-page-builder/types";
import { ZIP_PAGES_WAIT_TIME } from "./processZipPagesTasks";
import {
    IExportPagesZipPagesInput,
    IExportPagesControllerTaskParams,
    PageExportTask
} from "~/export/pages/types";

export const createZipPagesTasks = async (params: IExportPagesControllerTaskParams) => {
    const { response, input, isAborted, isCloseToTimeout, context, store } = params;

    const listPagesParams = {
        where: input.where,
        after: input.after,
        sort: input.sort,
        limit: 100
    };
    let currentBatch = input.currentBatch || 1;
    let result: [Page[], ListMeta];
    while ((result = await context.pageBuilder.listLatestPages(listPagesParams))) {
        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue(listPagesParams);
        }
        const [pages, meta] = result;

        if (isAborted()) {
            return response.aborted();
        }

        listPagesParams.after = meta.cursor;
        if (pages.length === 0 || !meta.hasMoreItems || !meta.cursor) {
            /**
             * In case current batch is 1, we can return done, because there are no pages to export.
             */
            if (currentBatch === 1) {
                return response.done("No pages to export.");
            }
            /**
             * No more pages to load and create subtasks, we can wait and continue the task.
             */
            return response.continue(
                {
                    ...listPagesParams,
                    processing: true
                },
                {
                    seconds: ZIP_PAGES_WAIT_TIME
                }
            );
        }

        const queue = pages.map(page => page.id);

        await context.tasks.trigger<IExportPagesZipPagesInput>({
            name: `Export Pages - Zip Pages Batch #${currentBatch}`,
            parent: store.getTask(),
            definition: PageExportTask.ZipPages,
            input: {
                queue,
                done: []
            }
        });
        currentBatch++;
        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue({
                ...listPagesParams,
                currentBatch
            });
        }
    }
    return response.done("Task done.");
};
