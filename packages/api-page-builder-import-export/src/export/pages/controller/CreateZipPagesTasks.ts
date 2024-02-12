import { ListMeta, ListPagesParams, Page } from "@webiny/api-page-builder/types";
import { ZIP_PAGES_WAIT_TIME } from "./ProcessZipPagesTasks";
import {
    IExportPagesControllerTaskParams,
    IExportPagesZipPagesInput,
    PageExportTask
} from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks/types";

const PAGES_IN_BATCH = 50;

/**
 * Go through all the pages and create subtasks for zipping pages in batches.
 */
export class CreateZipPagesTasks {
    public async execute({
        response,
        input,
        isAborted,
        isCloseToTimeout,
        context,
        store
    }: IExportPagesControllerTaskParams): Promise<ITaskResponseResult> {
        const listPagesParams: ListPagesParams = {
            where: input.where,
            after: input.after,
            limit: input.limit && input.limit > 0 ? input.limit : PAGES_IN_BATCH
        };

        let currentBatch = input.currentBatch || 1;
        let result: [Page[], ListMeta];
        while ((result = await context.pageBuilder.listLatestPages(listPagesParams))) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input,
                    ...listPagesParams,
                    currentBatch
                });
            }
            const [pages, meta] = result;

            listPagesParams.after = meta.cursor;
            /**
             * If no pages are returned there are two options:
             * * mark task as done because there are no pages at all
             * * continue with the control task, but in zippingPages mode
             */
            if (meta.totalCount === 0) {
                return response.done("No pages to export.");
            } else if (pages.length === 0) {
                return response.continue(
                    {
                        ...input,
                        ...listPagesParams,
                        currentBatch,
                        zippingPages: true
                    },
                    {
                        seconds: ZIP_PAGES_WAIT_TIME
                    }
                );
            }

            const queue = pages.map(page => page.id);
            /**
             * Trigger a task for each of the loaded pages batch.
             */
            await context.tasks.trigger<IExportPagesZipPagesInput>({
                name: `Page Builder - Export Pages - Zip Pages #${currentBatch}`,
                parent: store.getTask(),
                definition: PageExportTask.ZipPages,
                input: {
                    queue,
                    type: input.type
                }
            });
            /**
             * If there are no more pages to load, we can continue the controller task in a zippingPages mode, with some delay.
             */
            if (!meta.hasMoreItems || !meta.cursor) {
                return response.continue(
                    {
                        ...input,
                        ...listPagesParams,
                        currentBatch,
                        zippingPages: true
                    },
                    {
                        seconds: ZIP_PAGES_WAIT_TIME
                    }
                );
            }
            currentBatch++;
        }
        /**
         * Should not be possible to exit the loop without returning a response, but let's have a continue response here just in case.
         */
        return response.continue(
            {
                ...input,
                ...listPagesParams,
                currentBatch
            },
            {
                seconds: ZIP_PAGES_WAIT_TIME
            }
        );
    }
}
