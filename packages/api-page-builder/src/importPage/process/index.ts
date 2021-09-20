import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ExportTaskStatus, Page, PbContext } from "~/types";
import { importPage, updateMainTask } from "~/importPage/utils";

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
        let subTaskId;
        try {
            log("RUNNING Import Page Queue Process");
            const { invocationArgs: args, pageBuilder } = context;
            const { taskId, subTaskIds, currentTaskIndex } = args;

            /*
             * Note: We're not going to DB for getting next sub-task to process,
             * because the data might be out of sync due to GSI eventual consistency.
             */

            const currentTask = await pageBuilder.exportPageTask.getSubTask(
                taskId,
                subTaskIds[currentTaskIndex]
            );

            // Base condition!
            if (!currentTask || currentTask.status !== ExportTaskStatus.PENDING) {
                log(`No pending sub-task for task ${taskId}`);

                await pageBuilder.exportPageTask.update(taskId, {
                    status: ExportTaskStatus.COMPLETED,
                    data: {
                        message: `Finish importing ${subTaskIds.length} pages.`
                    }
                });

                return;
            }
            // Save it for error handling
            subTaskId = currentTask.id;
            console.log(`Fetched sub task => ${subTaskId}`);

            const { pageKey, category, zipFileKey, input } = currentTask.data;
            const { fileUploadsData } = input;

            console.log(`Processing page key "${pageKey}"`);

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

            // TODO: We want to continue with Self invocation no matter if current page error out.

            /*
             * Prepare "invocationArgs", we're hacking our wat here.
             * They are necessary to setup the "context.pageBuilder" object among other things in IMPORT_PAGE_FUNCTION
             */
            const { request } = context.http;
            const invocationArgs = {
                httpMethod: request.method,
                body: request.body,
                headers: request.headers,
                cookies: request.cookies
            };
            log(`Invoking function "${configuration.handlers.process}"`);

            // Invoke handler
            await context.handlerClient.invoke({
                name: configuration.handlers.process,
                payload: {
                    taskId,
                    subTaskIds,
                    currentTaskIndex: currentTaskIndex + 1,
                    ...invocationArgs
                },
                await: false
            });
        } catch (e) {
            console.log("Error => ", e);

            if (subTaskId) {
                /**
                 * In case of error, we'll update the task status to "failed",
                 * so that, client can show notify the user appropriately.
                 */
                const { invocationArgs: args, pageBuilder } = context;
                const { taskId } = args;

                await pageBuilder.exportPageTask.updateSubTask(taskId, subTaskId, {
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
                    subTaskId: subTaskId,
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
        }
    }
});
