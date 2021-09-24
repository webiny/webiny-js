import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ExportTaskStatus, PbContext } from "~/types";
import { s3StreamHandler } from "~/exportPageTask/s3StreamHandler";
import { ZipOfZip } from "~/exportPages/zipper";

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
export default (): HandlerPlugin<PbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const log = console.log;

        log("RUNNING Export Pages Combine Handler");
        const { invocationArgs: args, pageBuilder } = context;
        const { taskId } = args;

        try {
            const task = await pageBuilder.exportPageTask.get(taskId);

            const { exportPagesDataKey } = task.input;

            // Get all files (zip) from given key
            const listObjectResponse = await s3StreamHandler.listObject(exportPagesDataKey);

            const zipFileKeys = listObjectResponse.Contents.filter(
                file => file.Key !== exportPagesDataKey
            ).map(file => file.Key);

            // Prepare zip of all zips
            const zipOfZip = new ZipOfZip(zipFileKeys);

            // Upload
            const pageExportUpload = await zipOfZip.process();
            log(`Done uploading... File is located at ${pageExportUpload.Location} `);

            // Update task status and save export page data key
            await pageBuilder.exportPageTask.update(taskId, {
                status: ExportTaskStatus.COMPLETED,
                data: {
                    message: `Finish uploading page export.`,
                    key: pageExportUpload.Key,
                    url: pageExportUpload.Location
                }
            });
        } catch (e) {
            log("[EXPORT_PAGES_COMBINE] Error => ", e);

            /**
             * In case of error, we'll update the task status to "failed",
             * so that, client can show notify the user appropriately.
             */
            await pageBuilder.exportPageTask.update(taskId, {
                status: ExportTaskStatus.FAILED,
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
