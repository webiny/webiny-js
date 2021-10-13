import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { PageImportExportTaskStatus, PbPageImportExportContext } from "~/types";
import { s3Stream } from "../s3Stream";
import { ZipOfZip } from "../zipper";

export type HandlerArgs = {
    taskId: string;
};

export type HandlerResponse = {
    data: string;
    error: {
        message: string;
    };
};

/**
 * Handles the export pages combine workflow.
 */
export default (): HandlerPlugin<PbPageImportExportContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const log = console.log;

        log("RUNNING Export Pages Combine Handler");
        const { invocationArgs: args, pageBuilder } = context;
        const { taskId } = args;

        try {
            const task = await pageBuilder.pageImportExportTask.getTask(taskId);

            const { exportPagesDataKey } = task.input;

            // Get all files (zip) from given key
            const listObjectResponse = await s3Stream.listObject(exportPagesDataKey);

            const zipFileKeys = listObjectResponse.Contents.filter(
                file => file.Key !== exportPagesDataKey
            ).map(file => file.Key);

            // Prepare zip of all zips
            const zipOfZip = new ZipOfZip(zipFileKeys);

            // Upload
            const pageExportUpload = await zipOfZip.process();
            log(`Done uploading... File is located at ${pageExportUpload.Location} `);

            // Update task status and save export page data key
            await pageBuilder.pageImportExportTask.updateTask(taskId, {
                status: PageImportExportTaskStatus.COMPLETED,
                data: {
                    message: `Finish uploading page export.`,
                    key: pageExportUpload.Key,
                    url: pageExportUpload.Location
                }
            });

            // Remove individual zip files from storage
            const deleteFilePromises = zipFileKeys.map(key => s3Stream.deleteObject(key));
            await Promise.all(deleteFilePromises);
            log(`Successfully deleted ${deleteFilePromises.length} zip files.`);
        } catch (e) {
            log("[EXPORT_PAGES_COMBINE] Error => ", e);

            /**
             * In case of error, we'll update the task status to "failed",
             * so that, client can show notify the user appropriately.
             */
            await pageBuilder.pageImportExportTask.updateTask(taskId, {
                status: PageImportExportTaskStatus.FAILED,
                error: {
                    name: e.name,
                    message: e.message,
                    stack: e.stack,
                    code: "IMPORT_FAILED"
                }
            });

            return {
                data: null,
                error: {
                    message: e.message
                }
            };
        }
    }
});
