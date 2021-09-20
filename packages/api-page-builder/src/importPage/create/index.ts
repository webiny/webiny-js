import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ExportPageTask, ExportTaskStatus, Page, PbContext } from "~/types";
import { readExtractAndUploadZipFileContents } from "~/importPage/utils";

export type HandlerArgs = {
    category: string;
    data: {
        zipFileKey?: string;
        zipFileUrl?: string;
    };
    task: ExportPageTask;
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
        try {
            log("RUNNING Import Pages Create");
            const { invocationArgs: args, pageBuilder } = context;
            const { task, category, data } = args;
            // Step 1: Read the zip file
            const pagesDirMap = await readExtractAndUploadZipFileContents(data.zipFileKey);
            // Once we have map we can start processing each page
            const pageKeys = Object.keys(pagesDirMap);

            const subTaskIds = [];

            // For each page create a sub task and invoke the process handler
            for (let i = 0; i < pageKeys.length; i++) {
                const pageKey = pageKeys[i];
                // Create sub task
                const subtask = await pageBuilder.exportPageTask.createSubTask(task.id, {
                    status: ExportTaskStatus.PENDING,
                    data: {
                        pageKey,
                        category,
                        zipFileKey: data.zipFileKey,
                        // TODO: Maybe have a separate "input" attribute
                        input: {
                            fileUploadsData: pagesDirMap[pageKey]
                        }
                    }
                });
                console.log(`Added SUB_TASK "${subtask.id}" to queue.`);
                subTaskIds.push(subtask.id);
            }
            // Update main task status
            await pageBuilder.exportPageTask.update(task.id, {
                status: ExportTaskStatus.PROCESSING,
                stats: subTaskIds.reduce((previousValue, currentValue) => {
                    previousValue[currentValue] = ExportTaskStatus.PENDING;
                    return previousValue;
                }, {})
            });

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

            // Invoke handler
            await context.handlerClient.invoke({
                name: configuration.handlers.process,
                payload: {
                    taskId: task.id,
                    subTaskIds,
                    currentTaskIndex: 0,
                    ...invocationArgs
                },
                await: false
            });
        } catch (e) {
            console.log("Error => ", e);

            /**
             * In case of error, we'll update the task status to "failed",
             * so that, client can show notify the user appropriately.
             */
            const { invocationArgs: args, pageBuilder } = context;
            const { task } = args;

            await pageBuilder.exportPageTask.update(task.id, {
                status: ExportTaskStatus.FAILED,
                data: {
                    error: {
                        name: e.name,
                        message: e.message,
                        stack: e.stack,
                        code: "EXPORT_FAILED"
                    }
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
