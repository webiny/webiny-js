import {
    IListTaskParams,
    IListTasksResponse,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";
import { IExportPagesBatchInput, IExportPagesControllerInput, PageExportTask } from "./types";
import { PbImportExportContext } from "~/graphql/types";
import { ListMeta, Page } from "@webiny/api-page-builder/types";

export const exportPagesController = async (
    params: ITaskRunParams<PbImportExportContext, IExportPagesControllerInput>
): Promise<ITaskResponseResult> => {
    const { response, input, isAborted, isCloseToTimeout, context, store } = params;

    /**
     * In case task is processing, we need to check if subtasks are done.
     */
    if (input.processing) {
        let result: IListTasksResponse;
        const listTasksParams: IListTaskParams = {
            where: {
                parent: store.getTask().id
            },
            limit: 100,
            after: undefined
        };
        while ((result = await context.tasks.listTasks(listTasksParams))) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue(input);
            }
            const { items, meta } = result;
            if (items.length === 0) {
                return response.done("No subtasks to verify.");
            }
            listTasksParams.after = meta.cursor;
            const unfinished = items.some(item => item.taskStatus === "running");
            if (unfinished) {
                return response.continue({
                    ...input,
                    wait: 30
                });
            } else if (!meta.hasMoreItems) {
                const zippingTask = await context.tasks.trigger({
                    parent: store.getTask(),
                    definition: PageExportTask.Zipping,
                    name: "Page Export - Zipping"
                });
                return response.continue({
                    ...input,
                    processing: false,
                    zipping: zippingTask.id
                });
            }
        }
        return response.done("Subtasks done.");
    } else if (input.zipping) {
        const task = await context.tasks.getTask(input.zipping);
        if (!task) {
            return response.error({
                message: `Cannot find task with ID "${input.zipping}".`,
                code: "TASK_NOT_FOUND"
            });
        } else if (task.taskStatus === "running" || task.taskStatus === "pending") {
            return response.continue({
                ...input,
                wait: 30
            });
        } else if (task.taskStatus === "failed") {
            return response.error({
                message: `Zipping task "${task.id}" failed.`,
                code: "ZIP_ERROR"
            });
        } else if (task.taskStatus === "aborted") {
            return response.aborted();
        }
        return response.done("Zipping done.", {
            ...task.output
        });
    }

    const listPagesParams = {
        where: input.where,
        after: input.after,
        sort: input.sort,
        limit: 100
    };
    let currentBatch = input.currentBatch || 1;
    let result: [Page[], ListMeta];
    while ((result = await context.pageBuilder.listLatestPages(listPagesParams))) {
        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue(listPagesParams);
        }
        const [pages, meta] = result;

        if (isAborted()) {
            return response.aborted();
        }

        listPagesParams.after = meta.cursor;
        if (pages.length === 0 || !meta.hasMoreItems || !meta.cursor) {
            /**
             * In case current batch is 1, we can return done, because there are no pages to export.
             */
            if (currentBatch === 1) {
                return response.done("No pages to export.");
            }
            /**
             * No more pages to load and create subtasks, we can wait and continue the task.
             */
            return response.continue({
                ...listPagesParams,
                processing: true,
                wait: 30
            });
        }

        const queue = pages.map(page => page.id);

        await context.tasks.trigger<IExportPagesBatchInput>({
            name: `Export pages batch #${currentBatch}`,
            parent: store.getTask(),
            definition: PageExportTask.Batch,
            input: {
                queue,
                done: []
            }
        });
        currentBatch++;
        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue({
                ...listPagesParams,
                currentBatch
            });
        }
    }
    return response.done("Task done.");
};
