import { ITaskResponseResult } from "@webiny/tasks";
import { IExportPagesZipPagesTaskParams } from "~/export/pages/types";
import { PageExporter } from "~/export/process/exporters/PageExporter";
import { ZipPagesDataManager } from "./ZipPagesDataManager";
import { getPageFactory } from "./getPageFactory";
import { createExportPagesDataKey } from "~/export/pages/utils";

/**
 * We will pause the execution of the task if there is less than CLOSE_TO_TIMEOUT_SECONDS left on the Lambda execution time.
 */
const CLOSE_TO_TIMEOUT_SECONDS = 300;

export class ZipPages {
    public async execute(params: IExportPagesZipPagesTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        const parentId = store.getTask().parentId;
        if (!parentId) {
            return response.error({
                message: `Could not find parent task ID.`
            });
        }
        const exportPageDataKey = createExportPagesDataKey(parentId);

        const dataManager = new ZipPagesDataManager(input);
        if (dataManager.hasMore() === false) {
            return response.done("Task done.", {
                done: dataManager.getDone(),
                failed: dataManager.getFailed()
            });
        }

        const getPage = getPageFactory(context, store, input.type === "published");
        /**
         * We will go page by page and zip them.
         * We are using the input.queue here because we are removing page from the ZipPagesDataManager queue as it is processed.
         *
         */
        for (const pageId of input.queue) {
            /**
             * Check for a possibility that the task was aborted.
             */
            if (isAborted()) {
                return response.aborted();
            }
            /**
             * We need to check if there is enough time left to finish the task.
             */
            if (isCloseToTimeout(CLOSE_TO_TIMEOUT_SECONDS)) {
                /**
                 * If there is not enough time left, we will pause the task and return the current state.
                 */
                return response.continue(dataManager.getInput());
            }

            const page = await getPage(pageId);
            if (!page) {
                dataManager.addFailed(pageId);
                continue;
            }
            try {
                const pageExporter = new PageExporter(context.fileManager);
                const pageDataZip = await pageExporter.execute(page, exportPageDataKey);
                if (!pageDataZip.Key) {
                    throw new Error(`Failed to export page "${pageId}" into a zip file.`);
                }
                dataManager.addDone(pageId, pageDataZip.Key);
            } catch (ex) {
                const message = ex.message || `Failed to export page "${pageId}" into a zip file.`;
                try {
                    await store.addErrorLog({
                        message,
                        error: ex
                    });
                } catch {
                    console.error(`Failed to add error log: "${message}"`);
                }
                dataManager.addFailed(pageId);
            }
        }

        return response.done("Task done.", {
            done: dataManager.getDone(),
            failed: dataManager.getFailed()
        });
    }
}
