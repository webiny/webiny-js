import { ImportExportTaskStatus, PbImportExportContext } from "~/types";
import { s3Stream } from "../s3Stream";
import { ZipOfZip } from "../zipper";
import { mockSecurity } from "~/mockSecurity";
import { Payload, Response } from "~/export/combine";

/**
 * Handles the export pages combine workflow.
 */
export const pagesHandler = async (
    payload: Payload,
    context: PbImportExportContext
): Promise<Response> => {
    const log = console.log;

    log("RUNNING Export Pages Combine Handler");
    const { pageBuilder } = context;
    const { taskId, identity } = payload;

    mockSecurity(identity, context);

    try {
        const task = await pageBuilder.importExportTask.getTask(taskId);
        if (!task) {
            return {
                data: null,
                error: {
                    message: `There is no task with ID "${taskId}".`
                }
            };
        }

        const { exportPagesDataKey } = task.input;

        // Get all files (zip) from given key
        const listObjectResponse = await s3Stream.listObject(exportPagesDataKey);
        if (!listObjectResponse.Contents) {
            return {
                data: null,
                error: {
                    message: "There is no Contents defined on S3 Stream while combining pages."
                }
            };
        }

        const zipFileKeys = listObjectResponse.Contents.filter(
            file => file.Key !== exportPagesDataKey
        )
            .map(file => file.Key)
            .filter(Boolean) as string[];

        // Prepare zip of all zips
        const zipOfZip = new ZipOfZip(zipFileKeys, "WEBINY_PAGE_EXPORT.zip");

        // Upload
        const pageExportUpload = await zipOfZip.process();
        log(`Done uploading... File is located at ${pageExportUpload.Location} `);

        // Update task status and save export page data key
        await pageBuilder.importExportTask.updateTask(taskId, {
            status: ImportExportTaskStatus.COMPLETED,
            data: {
                message: `Finish uploading page export.`,
                key: pageExportUpload.Key,
                url: await s3Stream.getPresignedUrl(pageExportUpload.Key)
            }
        });

        // Remove individual zip files from storage
        const deleteFilePromises = zipFileKeys.map(key => s3Stream.deleteObject(key));
        await Promise.all(deleteFilePromises);
        log(`Successfully deleted ${deleteFilePromises.length} zip files.`);
    } catch (e) {
        log("[EXPORT_PAGES_COMBINE] Error => ", e.message);

        /**
         * In case of error, we'll update the task status to "failed",
         * so that, client can show notify the user appropriately.
         */
        await pageBuilder.importExportTask.updateTask(taskId, {
            status: ImportExportTaskStatus.FAILED,
            error: {
                name: e.name,
                message: e.message,
                code: "EXPORT_FAILED"
            }
        });

        return {
            data: null,
            error: {
                message: e.message
            }
        };
    }
    return {
        data: "",
        error: null
    };
};
