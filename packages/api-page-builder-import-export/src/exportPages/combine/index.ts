import { PageImportExportTaskStatus, PbPageImportExportContext } from "~/types";
import { s3Stream } from "../s3Stream";
import { ZipOfZip } from "../zipper";
import { mockSecurity } from "~/mockSecurity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createRawEventHandler } from "@webiny/handler-aws";

export interface Payload {
    taskId: string;
    identity: SecurityIdentity;
}

export interface Response {
    data: string | null;
    error: Partial<Error> | null;
}

/**
 * Handles the export pages combine workflow.
 */
export default () => {
    return createRawEventHandler<Payload, PbPageImportExportContext, Response>(
        async ({ payload, context }) => {
            const log = console.log;

            log("RUNNING Export Pages Combine Handler");
            const { pageBuilder } = context;
            const { taskId, identity } = payload;

            mockSecurity(identity, context);

            try {
                const task = await pageBuilder.pageImportExportTask.getTask(taskId);
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
                            message:
                                "There is no Contents defined on S3 Stream while combining pages."
                        }
                    };
                }

                const zipFileKeys = listObjectResponse.Contents.filter(
                    file => file.Key !== exportPagesDataKey
                )
                    .map(file => file.Key)
                    .filter(Boolean) as string[];

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
                        url: s3Stream.getPresignedUrl(pageExportUpload.Key)
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
        }
    );
};
