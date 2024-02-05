import { ImportExportTaskStatus, PbImportExportContext } from "~/types";
import { importPage } from "./importPage";
import { invokeHandlerClient } from "~/client";
import { mockSecurity } from "~/mockSecurity";
import { zeroPad } from "@webiny/utils";
import { Configuration, Payload, Response } from "~/import/process";

export const pagesHandler = async (
    configuration: Configuration,
    payload: Payload,
    context: PbImportExportContext
): Promise<Response> => {
    const log = console.log;
    let subTask;
    let noPendingTask = true;
    let prevStatusOfSubTask = ImportExportTaskStatus.PENDING;

    log("RUNNING Import Page Queue Process");
    const { pageBuilder } = context;
    const { taskId, subTaskIndex, type, identity } = payload;
    // Disable authorization; this is necessary because we call Page Builder CRUD methods which include authorization checks
    // and this Lambda is invoked internally, without credentials.
    mockSecurity(identity, context);

    try {
        /*
         * Note: We're not going to DB for getting next sub-task to process,
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
        prevStatusOfSubTask = subTask.status;

        log(`Fetched sub task => ${subTask.id}`);

        const { pageKey, category, input, meta } = subTask.data;
        const { fileUploadsData } = input;

        log(`Processing page key "${pageKey}"`);

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

        // Real job
        const page = await importPage({
            context,
            pageKey,
            fileUploadsData
        });

        // Create a page
        let pbPage = await context.pageBuilder.createPage(category, meta);

        // Hooks attached to `pageBuilder.createPage` might enable security back again, here we disable security
        mockSecurity(identity, context);

        // Update page with data
        pbPage = await context.pageBuilder.updatePage(pbPage.id, {
            content: page.content,
            title: page.title,
            path: page.path,
            settings: page.settings
        });

        // Hooks attached to `pageBuilder.updatePage` might enable security back again, here we disable security
        mockSecurity(identity, context);

        // TODO: Publish page

        // Update task record in DB
        subTask = await pageBuilder.importExportTask.updateSubTask(taskId, subTask.id, {
            status: ImportExportTaskStatus.COMPLETED,
            data: {
                message: "Done",
                page: {
                    id: pbPage.id,
                    title: pbPage.title,
                    version: pbPage.version,
                    status: pbPage.status
                }
            }
        });
        // Update stats in main task
        await pageBuilder.importExportTask.updateStats(taskId, {
            prevStatus: prevStatusOfSubTask,
            nextStatus: ImportExportTaskStatus.COMPLETED
        });
        prevStatusOfSubTask = subTask.status;
    } catch (e) {
        log("[IMPORT_PAGES_PROCESS] Error => ", e);

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
                    code: "IMPORT_FAILED"
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

            await pageBuilder.importExportTask.updateTask(taskId, {
                status: ImportExportTaskStatus.COMPLETED,
                data: {
                    message: `Finish importing pages.`
                }
            });
        } else {
            log(`Invoking PROCESS for task "${subTaskIndex + 1}"`);
            // We want to continue with Self invocation no matter if current page error out.
            await invokeHandlerClient<Payload>({
                context,
                name: configuration.handlers.process,
                payload: {
                    taskId,
                    subTaskIndex: subTaskIndex + 1,
                    type,
                    identity: context.security.getIdentity()
                },
                description: "Import pages - process - subtask"
            });
        }
    }
    return {
        data: "",
        error: null
    };
};
