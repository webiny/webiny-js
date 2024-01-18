import { IExportPagesZipPagesInput, IExportPagesZipPagesTaskParams } from "~/export/pages/types";
import { ITaskManagerStore, ITaskResponseResult } from "@webiny/tasks";
import { PageExporter } from "~/export/process/exporters/PageExporter";
import { PbImportExportContext } from "~/graphql/types";
import { ZipPagesDataManager } from "./ZipPagesDataManager";

export const EXPORT_PAGES_FOLDER_KEY = "WEBINY_PB_EXPORT_PAGES";

/**
 * We will pause the execution of the task if there is less than CLOSE_TO_TIMEOUT_SECONDS left on the Lambda execution time.
 */
const CLOSE_TO_TIMEOUT_SECONDS = 300;

const getPageFactory = (
    context: PbImportExportContext,
    store: ITaskManagerStore<IExportPagesZipPagesInput>
) => {
    return async (pageId: string, published?: boolean) => {
        try {
            if (published) {
                return await context.pageBuilder.getPublishedPageById({
                    id: pageId
                });
            }
            return await context.pageBuilder.getPage(pageId);
        } catch (ex) {
            const message = `There is no${published ? " published" : ""} page with ID ${pageId}.`;
            try {
                await store.addErrorLog({
                    message,
                    error: ex
                });
            } catch {
                console.error(`Failed to add error log: "${message}"`);
            }
            return null;
        }
    };
};

export class ZipPages {
    public async execute(params: IExportPagesZipPagesTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        const dataManager = new ZipPagesDataManager(input);
        if (dataManager.hasMore() === false) {
            return response.done("Task done.", {
                done: input.done || {},
                failed: input.failed || []
            });
        }

        const getPage = getPageFactory(context, store);
        /**
         * We will go page by page and zip them.
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
                const exportPageDataKey = `${EXPORT_PAGES_FOLDER_KEY}/${page.pid}`;
                const pageExporter = new PageExporter(context.fileManager);
                const pageDataZip = await pageExporter.execute(page, exportPageDataKey);
                if (!pageDataZip?.Key) {
                    const message = `Failed to export page "${pageId}" into a zip file.`;
                    throw new Error(message);
                }
                dataManager.addDone(pageId, pageDataZip.Key);
            } catch (ex) {
                try {
                    await store.addErrorLog({
                        message: ex.message || `Failed to export page "${pageId}" into a zip file.`,
                        error: ex
                    });
                } catch {
                    console.error(`Failed to add error log: "${ex.message}"`);
                }
                dataManager.addFailed(pageId);
            }
        }

        return response.continue(dataManager.getInput());
    }
}
