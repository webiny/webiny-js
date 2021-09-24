import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ExportTaskStatus, PbContext } from "~/types";
import { updateMainTask, zeroPad } from "~/importPage/utils";
import { invokeHandlerClient } from "~/importPage/client";
import { NotFoundError } from "@webiny/handler-graphql";
import { exportPage } from "~/exportPages/utils";
import { HandlerArgs as ExtractHandlerArgs } from "../combine";

export type HandlerArgs = {
    taskId: string;
    subTaskIndex: number;
};

export type HandlerResponse = {
    data: string;
    error: {
        message: string;
    };
};

interface Configuration {
    handlers: {
        process: string;
        extract: string;
    };
}

/**
 * Handles the export pages process workflow.
 */
export default (
    configuration: Configuration
): HandlerPlugin<PbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const log = console.log;
        let subTask;
        let noPendingTask = true;
        let prevStatusOfSubTask = ExportTaskStatus.PENDING;

        log("RUNNING Export Pages Process Handler");
        const { invocationArgs: args, pageBuilder } = context;
        const { taskId, subTaskIndex } = args;

        try {
            /*
             * Note: We're not going to DB for finding the next sub-task to process,
             * because the data might be out of sync due to GSI eventual consistency.
             */
            subTask = await pageBuilder.exportPageTask.getSubTask(taskId, zeroPad(subTaskIndex));
            /**
             * Base condition!!
             * Bail out early, if task not found or task's status is not "pending".
             */
            if (!subTask || subTask.status !== ExportTaskStatus.PENDING) {
                noPendingTask = true;
                return;
            } else {
                noPendingTask = false;
            }

            log(`Fetched sub task => ${subTask.id}`);

            const { input } = subTask;
            const { pageId, exportPagesDataKey } = input;

            /**
             * At the moment, we're only interested in the published revision of the page.
             * And in case of no published version available, we use the latest revision.-
             */
            let page;
            try {
                // Get published page.
                page = await pageBuilder.pages.getPublishedById({ id: pageId });
            } catch (e) {
                // If no published page be found, get latest page.
                if (e instanceof NotFoundError) {
                    page = await pageBuilder.pages.get(pageId);
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
            subTask = await pageBuilder.exportPageTask.updateSubTask(taskId, subTask.id, {
                status: ExportTaskStatus.PROCESSING
            });
            // Update stats in main task
            await updateMainTask({
                pageBuilder,
                taskId,
                currentStatus: ExportTaskStatus.PROCESSING,
                previousStatus: prevStatusOfSubTask
            });
            prevStatusOfSubTask = subTask.status;

            log(`Extracting page data and uploading to storage...`);
            // Extract Page
            const pageDataZip = await exportPage(page, exportPagesDataKey);
            log(`Finish uploading zip...`);
            // Update task record in DB
            subTask = await pageBuilder.exportPageTask.updateSubTask(taskId, subTask.id, {
                status: ExportTaskStatus.COMPLETED,
                data: {
                    message: `Finish uploading data for page "${page.id}" v${page.version} (${page.status}).`,
                    key: pageDataZip.Key
                }
            });
            // Update stats in main task
            await updateMainTask({
                pageBuilder,
                taskId,
                currentStatus: ExportTaskStatus.COMPLETED,
                previousStatus: prevStatusOfSubTask
            });
            prevStatusOfSubTask = subTask.status;
        } catch (e) {
            log("[EXPORT_PAGES_PROCESS] Error => ", e);

            if (subTask && subTask.id) {
                /**
                 * In case of error, we'll update the task status to "failed",
                 * so that, client can show notify the user appropriately.
                 */
                const { invocationArgs: args, pageBuilder } = context;
                const { taskId } = args;

                subTask = await pageBuilder.exportPageTask.updateSubTask(taskId, subTask.id, {
                    status: ExportTaskStatus.FAILED,
                    error: {
                        name: e.name,
                        message: e.message,
                        stack: e.stack,
                        code: "IMPORT_FAILED"
                    }
                });

                // Update stats in main task
                await updateMainTask({
                    pageBuilder,
                    taskId,
                    currentStatus: ExportTaskStatus.FAILED,
                    previousStatus: prevStatusOfSubTask
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
                await invokeHandlerClient<ExtractHandlerArgs>({
                    context,
                    name: configuration.handlers.extract,
                    payload: {
                        taskId
                    }
                });
            } else {
                console.log(`Invoking PROCESS for task "${subTaskIndex + 1}"`);
                // We want to continue with Self invocation no matter if current page error out.
                await invokeHandlerClient<HandlerArgs>({
                    context,
                    name: configuration.handlers.process,
                    payload: {
                        taskId,
                        subTaskIndex: subTaskIndex + 1
                    }
                });
            }
        }
    }
});
