import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { PageImportExportTaskStatus, Page, PbContext } from "~/types";
import { importPage, updateMainTask, zeroPad } from "~/importPages/utils";
import { invokeHandlerClient } from "~/importPages/client";

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

export type CreatePage = () => Promise<Page>;
export type UpdatePage = (page: Page, content: Record<string, any>) => Promise<Page>;

interface Configuration {
    handlers: {
        process: string;
    };
}

/**
 * Handles the import page workflow.
 */
export default (
    configuration: Configuration
): HandlerPlugin<PbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const log = console.log;
        let subTask;
        let noPendingTask = true;
        let prevStatusOfSubTask = PageImportExportTaskStatus.PENDING;

        log("RUNNING Import Page Queue Process");
        const { invocationArgs: args, pageBuilder } = context;
        const { taskId, subTaskIndex } = args;

        try {
            /*
             * Note: We're not going to DB for getting next sub-task to process,
             * because the data might be out of sync due to GSI eventual consistency.
             */

            subTask = await pageBuilder.pageImportExportTask.getSubTask(
                taskId,
                zeroPad(subTaskIndex)
            );
            prevStatusOfSubTask = subTask.status;

            /**
             * Base condition!!
             * Bail out early, if task not found or task's status is not "pending".
             */
            if (!subTask || subTask.status !== PageImportExportTaskStatus.PENDING) {
                noPendingTask = true;
                return;
            } else {
                noPendingTask = false;
            }

            log(`Fetched sub task => ${subTask.id}`);

            const { pageKey, category, zipFileKey, input } = subTask.data;
            const { fileUploadsData } = input;

            log(`Processing page key "${pageKey}"`);

            // Mark task status as PROCESSING
            subTask = await pageBuilder.pageImportExportTask.updateSubTask(taskId, subTask.id, {
                status: PageImportExportTaskStatus.PROCESSING
            });
            // Update stats in main task
            await updateMainTask({
                pageBuilder,
                taskId,
                currentStatus: PageImportExportTaskStatus.PROCESSING,
                previousStatus: prevStatusOfSubTask
            });
            prevStatusOfSubTask = subTask.status;

            // Real job
            const pageContent = await importPage({
                context,
                pageKey,
                key: zipFileKey,
                fileUploadsData
            });

            // Create a page
            const pbPage = await context.pageBuilder.pages.create(category);

            // Update page with data
            await context.pageBuilder.pages.update(pbPage.id, {
                content: pageContent,
                title: pbPage.title
            });

            // Update task record in DB
            subTask = await pageBuilder.pageImportExportTask.updateSubTask(taskId, subTask.id, {
                status: PageImportExportTaskStatus.COMPLETED,
                data: {
                    message: "Done"
                }
            });
            // Update stats in main task
            await updateMainTask({
                pageBuilder,
                taskId,
                currentStatus: PageImportExportTaskStatus.COMPLETED,
                previousStatus: prevStatusOfSubTask
            });
            prevStatusOfSubTask = subTask.status;
        } catch (e) {
            log("[IMPORT_PAGES_PROCESS] Error => ", e);

            if (subTask && subTask.id) {
                /**
                 * In case of error, we'll update the task status to "failed",
                 * so that, client can show notify the user appropriately.
                 */
                const { invocationArgs: args, pageBuilder } = context;
                const { taskId } = args;

                subTask = await pageBuilder.pageImportExportTask.updateSubTask(taskId, subTask.id, {
                    status: PageImportExportTaskStatus.FAILED,
                    data: {
                        error: {
                            name: e.name,
                            message: e.message,
                            stack: e.stack,
                            code: "IMPORT_FAILED"
                        }
                    }
                });

                // Update stats in main task
                await updateMainTask({
                    pageBuilder,
                    taskId,
                    currentStatus: PageImportExportTaskStatus.FAILED,
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

                await pageBuilder.pageImportExportTask.update(taskId, {
                    status: PageImportExportTaskStatus.COMPLETED,
                    data: {
                        message: `Finish importing pages.`
                    }
                });
            } else {
                log(`Invoking PROCESS for task "${subTaskIndex + 1}"`);
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
