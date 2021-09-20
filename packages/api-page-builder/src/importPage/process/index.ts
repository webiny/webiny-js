import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ExportTaskStatus, Page, PbContext } from "~/types";
import { importPage, updateMainTask } from "~/importPage/utils";
import { invokeHandlerClient } from "~/importPage/client";

export type HandlerArgs = {
    taskId: string;
    subTaskIds: string[];
    currentTaskIndex: number;
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
        let currentTask;
        let noPendingTask = false;

        log("RUNNING Import Page Queue Process");
        const { invocationArgs: args, pageBuilder } = context;
        const { taskId, subTaskIds, currentTaskIndex } = args;

        try {
            /*
             * Note: We're not going to DB for getting next sub-task to process,
             * because the data might be out of sync due to GSI eventual consistency.
             */

            currentTask = await pageBuilder.exportPageTask.getSubTask(
                taskId,
                subTaskIds[currentTaskIndex]
            );

            // Base condition!
            if (!currentTask || currentTask.status !== ExportTaskStatus.PENDING) {
                noPendingTask = true;

                return;
            }

            log(`Fetched sub task => ${currentTask.id}`);

            const { pageKey, category, zipFileKey, input } = currentTask.data;
            const { fileUploadsData } = input;

            log(`Processing page key "${pageKey}"`);

            // Mark task status as PROCESSING
            await pageBuilder.exportPageTask.updateSubTask(taskId, currentTask.id, {
                status: ExportTaskStatus.PROCESSING
            });
            // Update stats in main task
            await updateMainTask({
                pageBuilder,
                taskId,
                subTaskId: currentTask.id,
                status: ExportTaskStatus.PROCESSING
            });

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
            await pageBuilder.exportPageTask.updateSubTask(taskId, currentTask.id, {
                status: ExportTaskStatus.COMPLETED,
                data: {
                    message: "Done"
                }
            });
            // Update stats in main task
            await updateMainTask({
                pageBuilder,
                taskId,
                subTaskId: currentTask.id,
                status: ExportTaskStatus.COMPLETED
            });
        } catch (e) {
            log("[IMPORT_PAGES_PROCESS] Error => ", e);

            if (currentTask && currentTask.id) {
                /**
                 * In case of error, we'll update the task status to "failed",
                 * so that, client can show notify the user appropriately.
                 */
                const { invocationArgs: args, pageBuilder } = context;
                const { taskId } = args;

                await pageBuilder.exportPageTask.updateSubTask(taskId, currentTask.id, {
                    status: ExportTaskStatus.FAILED,
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
                    subTaskId: currentTask.id,
                    status: ExportTaskStatus.FAILED,
                    error: {
                        name: e.name,
                        message: e.message
                    }
                });
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

                await pageBuilder.exportPageTask.update(taskId, {
                    status: ExportTaskStatus.COMPLETED,
                    data: {
                        message: `Finish importing ${subTaskIds.length} pages.`
                    }
                });
            } else {
                console.log(`Invoking PROCESS for task "${subTaskIds[currentTaskIndex + 1]}"`);
                // We want to continue with Self invocation no matter if current page error out.
                await invokeHandlerClient({
                    context,
                    name: configuration.handlers.process,
                    payload: {
                        taskId,
                        subTaskIds,
                        currentTaskIndex: currentTaskIndex + 1
                    }
                });
            }
        }
    }
});
