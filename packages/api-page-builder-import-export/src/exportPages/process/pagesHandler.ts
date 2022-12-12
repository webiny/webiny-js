import { ExportRevisionType, ImportExportTaskStatus, PbImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/client";
import { NotFoundError } from "@webiny/handler-graphql";
import { exportPage } from "~/exportPages/utils";
import { Payload as ExtractPayload } from "../combine";
import { mockSecurity } from "~/mockSecurity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { zeroPad } from "@webiny/utils";
import { Configuration, Payload, Response } from "~/exportPages/process";

/**
 * Handles the export pages process workflow.
 */
export const pagesHandler = async (
    configuration: Configuration,
    payload: Payload,
    context: PbImportExportContext
): Promise<Response> => {
    const log = console.log;
    let subTask;
    let noPendingTask = true;
    let prevStatusOfSubTask = ImportExportTaskStatus.PENDING;

    log("RUNNING Export Pages Process Handler");
    const { pageBuilder, fileManager } = context;
    const { taskId, subTaskIndex, type, identity } = payload;
    // Disable authorization; this is necessary because we call Page Builder CRUD methods which include authorization checks
    // and this Lambda is invoked internally, without credentials.
    mockSecurity(identity as SecurityIdentity, context);

    try {
        /*
         * Note: We're not going to DB for finding the next sub-task to process,
         * because the data might be out of sync due to GSI eventual consistency.
         */
        subTask = await pageBuilder.importExportTask.getSubTask(taskId, zeroPad(subTaskIndex, 5));
        /**
         * Base condition!!
         * Bail out early, if task not found or task's status is not "pending".
         */
        if (!subTask || subTask.status !== ImportExportTaskStatus.PENDING) {
            noPendingTask = true;
            return {
                data: "",
                error: null
            };
        } else {
            noPendingTask = false;
        }

        log(`Fetched sub task => ${subTask.id}`);

        const { input } = subTask;
        const { pageId, exportPagesDataKey, revisionType } = input;

        /**
         * At the moment, we only export a single revision of the page.
         * It could be "published" or "latest" depending upon user input.
         *
         * Note: In case of no "published" revision available, we use the latest revision.
         */
        let page;
        try {
            if (revisionType === ExportRevisionType.PUBLISHED) {
                // Get "published" page.
                page = await pageBuilder.getPublishedPageById({ id: pageId });
            } else {
                // Get "latest" page.
                page = await pageBuilder.getPage(pageId);
            }
        } catch (e) {
            // If we're looking for "published" page and doesn't found it, get latest page.
            if (revisionType === ExportRevisionType.PUBLISHED && e instanceof NotFoundError) {
                page = await pageBuilder.getPage(pageId);
            } else {
                throw e;
            }
        }

        if (!page) {
            log(`Unable to load page "${pageId}"`);
            throw new NotFoundError(`Unable to load page "${pageId}"`);
        }

        log(`Processing page key "${pageId}" | version ${page.version} | ${page.status}`);

        // Mark task status as PROCESSING
        subTask = await pageBuilder.importExportTask.updateSubTask(taskId, subTask.id, {
            status: ImportExportTaskStatus.PROCESSING
        });
        // Update stats in main task
        await pageBuilder.importExportTask.updateStats(taskId, {
            prevStatus: prevStatusOfSubTask,
            nextStatus: ImportExportTaskStatus.PROCESSING
        });
        prevStatusOfSubTask = subTask.status;

        log(`Extracting page data and uploading to storage...`);
        // Extract Page
        const pageDataZip = await exportPage(page, exportPagesDataKey, fileManager);
        log(`Finish uploading zip...`);
        // Update task record in DB
        subTask = await pageBuilder.importExportTask.updateSubTask(taskId, subTask.id, {
            status: ImportExportTaskStatus.COMPLETED,
            data: {
                message: `Finish uploading data for page "${page.id}" v${page.version} (${page.status}).`,
                key: pageDataZip.Key
            }
        });
        // Update stats in main task
        await pageBuilder.importExportTask.updateStats(taskId, {
            prevStatus: prevStatusOfSubTask,
            nextStatus: ImportExportTaskStatus.COMPLETED
        });
        prevStatusOfSubTask = subTask.status;
    } catch (e) {
        log("[EXPORT_PAGES_PROCESS] Error => ", e);

        if (subTask && subTask.id) {
            /**
             * In case of error, we'll update the task status to "failed",
             * so that, client can show notify the user appropriately.
             */
            subTask = await pageBuilder.importExportTask.updateSubTask(taskId, subTask.id, {
                status: ImportExportTaskStatus.FAILED,
                error: {
                    name: e.name,
                    message: e.message,
                    stack: e.stack,
                    code: "EXPORT_FAILED"
                }
            });

            // Update stats in main task
            await pageBuilder.importExportTask.updateStats(taskId, {
                prevStatus: prevStatusOfSubTask,
                nextStatus: ImportExportTaskStatus.FAILED
            });
            prevStatusOfSubTask = subTask.status;
        }

        return {
            data: null,
            error: {
                message: e.message
            }
        };
    } finally {
        // Base condition!
        if (noPendingTask) {
            log(`No pending sub-task for task ${taskId}`);
            // Combine individual page zip files.
            await invokeHandlerClient<ExtractPayload>({
                context,
                name: configuration.handlers.combine,
                payload: {
                    taskId,
                    type,
                    identity: context.security.getIdentity()
                },
                description: "Export pages - combine"
            });
        } else {
            console.log(`Invoking PROCESS for task "${subTaskIndex + 1}"`);
            // We want to continue with Self invocation no matter if current page error out.
            await invokeHandlerClient<Payload>({
                context,
                name: configuration.handlers.process,
                payload: {
                    taskId,
                    type,
                    subTaskIndex: subTaskIndex + 1,
                    identity: context.security.getIdentity()
                },
                description: "Export pages - process - subtask"
            });
        }
    }
    return {
        data: "",
        error: null
    };
};
