import type { CmsEntryListParams } from "@webiny/api-headless-cms/types/index.js";
import { TaskCache } from "./TaskCache.js";
import type { IBulkActionOperationByModelTaskParams } from "~/types.js";
import { BulkActionOperationByModelAction } from "~/types.js";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";
import { BulkActionContext } from "~/features/BulkActionContext/index.js";

const MAX_TASK_LIST_LENGTH = 10;

/**
 * The `CreateTasksByModel` class handles the execution of a task to process entries in batches.
 */
export class CreateTasksByModel {
    private readonly taskCache: TaskCache;
    private readonly batchSize: number;
    private readonly bulkAction: EntryBulkAction.Interface;
    private readonly context: BulkActionContext.Interface;

    constructor(
        context: BulkActionContext.Interface,
        bulkAction: EntryBulkAction.Interface,
        taskDefinition: string,
        batchSize: number
    ) {
        this.taskCache = new TaskCache(taskDefinition);
        this.batchSize = batchSize;
        this.bulkAction = bulkAction;
        this.context = context;
    }

    async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, controller } = params;

        try {
            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                search: input.search,
                after: input.after,
                limit: this.batchSize
            };

            while (true) {
                if (controller.runtime.isAborted()) {
                    return controller.response.aborted();
                } else if (controller.runtime.isCloseToTimeout()) {
                    await this.taskCache.triggerTask(this.context, controller.state.getTask());
                    return controller.response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                // List entries from the HCMS based on the provided query
                const { entries, meta } = await this.bulkAction.loadData({
                    modelId: input.modelId,
                    ...listEntriesParams
                });

                // End the task if no entries match the query
                if (meta.totalCount === 0) {
                    return controller.response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.END_TASK
                    });
                }

                // Continue processing if we are reached the task list length limit
                if (this.taskCache.getTasksLength() === MAX_TASK_LIST_LENGTH) {
                    await this.taskCache.triggerTask(this.context, controller.state.getTask());
                    return controller.response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                // Continue processing if no entries are returned in the current batch
                if (entries.length === 0) {
                    await this.taskCache.triggerTask(this.context, controller.state.getTask());
                    return controller.response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                // Extract entry IDs
                const ids: string[] = [];
                for (let i = 0; i < entries.length; i++) {
                    ids.push(entries[i].id);
                }

                if (ids.length > 0) {
                    // Cache the task with the entry IDs
                    this.taskCache.cacheTask({
                        modelId: input.modelId,
                        identity: input.identity,
                        data: input.data,
                        ids
                    });
                }

                // Continue processing if there are no more entries or pagination is complete
                if (!meta.hasMoreItems || !meta.cursor) {
                    await this.taskCache.triggerTask(this.context, controller.state.getTask());

                    return controller.response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                listEntriesParams.after = meta.cursor;
            }
        } catch (ex) {
            return controller.response.error(ex.message ?? `Error while creating task.`);
        }
    }
}
