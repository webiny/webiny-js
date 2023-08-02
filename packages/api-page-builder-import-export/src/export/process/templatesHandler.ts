import { ImportExportTaskStatus, PbImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/client";
import { NotFoundError } from "@webiny/handler-graphql";
import { Payload as ExtractPayload } from "../combine";
import { mockSecurity } from "~/mockSecurity";
import { SecurityIdentity } from "@webiny/api-security/types";
import { zeroPad } from "@webiny/utils";
import { Configuration, Payload, Response } from "~/export/process";
import { PageTemplateExporter } from "~/export/process/exporters/PageTemplateExporter";

/**
 * Handles the export templates process workflow.
 */
export const templatesHandler = async (
    configuration: Configuration,
    payload: Payload,
    context: PbImportExportContext
): Promise<Response> => {
    const log = console.log;
    let subTask;
    let noPendingTask = true;
    let prevStatusOfSubTask = ImportExportTaskStatus.PENDING;

    log("RUNNING Export Templates Process Handler");
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
        const { templateId, exportTemplatesDataKey } = input;

        const template = await pageBuilder.getPageTemplate({ where: { id: templateId } });

        if (!template) {
            log(`Unable to load template "${templateId}"`);
            throw new NotFoundError(`Unable to load template "${templateId}"`);
        }

        log(`Processing template key "${templateId}"`);

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

        log(`Extracting template data and uploading to storage...`);
        const templateExporter = new PageTemplateExporter(fileManager);
        const templateDataZip = await templateExporter.execute(template, exportTemplatesDataKey);

        log(`Finish uploading zip...`);
        // Update task record in DB
        subTask = await pageBuilder.importExportTask.updateSubTask(taskId, subTask.id, {
            status: ImportExportTaskStatus.COMPLETED,
            data: {
                message: `Finish uploading data for template "${template.id}"`,
                key: templateDataZip.Key
            }
        });
        // Update stats in main task
        await pageBuilder.importExportTask.updateStats(taskId, {
            prevStatus: prevStatusOfSubTask,
            nextStatus: ImportExportTaskStatus.COMPLETED
        });
        prevStatusOfSubTask = subTask.status;
    } catch (e) {
        log("[EXPORT_TEMPLATES_PROCESS] Error => ", e.message);

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
            // Combine individual template zip files.
            await invokeHandlerClient<ExtractPayload>({
                context,
                name: configuration.handlers.combine,
                payload: {
                    taskId,
                    type,
                    identity: context.security.getIdentity()
                },
                description: "Export templates - combine"
            });
        } else {
            console.log(`Invoking PROCESS for task "${subTaskIndex + 1}"`);
            // We want to continue with Self invocation no matter if current template error out.
            await invokeHandlerClient<Payload>({
                context,
                name: configuration.handlers.process,
                payload: {
                    taskId,
                    subTaskIndex: subTaskIndex + 1,
                    type,
                    identity: context.security.getIdentity()
                },
                description: "Export templates - process - subtask"
            });
        }
    }
    return {
        data: "",
        error: null
    };
};
