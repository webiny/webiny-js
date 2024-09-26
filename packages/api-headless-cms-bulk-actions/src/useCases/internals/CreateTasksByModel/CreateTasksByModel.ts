import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCache } from "./TaskCache";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { IListEntries } from "~/abstractions";
import { BulkActionOperationByModelAction, IBulkActionOperationByModelTaskParams } from "~/types";

const MAX_TASK_LIST_LENGTH = 10;

/**
 * The `CreateTasksByModel` class handles the execution of a task to process entries in batches.
 */
export class CreateTasksByModel {
    private readonly taskCache: TaskCache;
    private listEntriesGateway: IListEntries;
    private readonly batchSize: number;

    constructor(taskDefinition: string, listEntriesGateway: IListEntries, batchSize: number) {
        this.taskCache = new TaskCache(taskDefinition);
        this.listEntriesGateway = listEntriesGateway;
        this.batchSize = batchSize;
    }

    async execute(params: IBulkActionOperationByModelTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        try {
            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                search: input.search,
                after: input.after,
                limit: this.batchSize
            };

            while (true) {
                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    return response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                // List entries from the HCMS based on the provided query
                const { entries, meta } = await this.listEntriesGateway.execute(
                    input.modelId,
                    listEntriesParams
                );

                // End the task if no entries match the query
                if (meta.totalCount === 0) {
                    return response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.END_TASK
                    });
                }

                // Continue processing if we are reached the task list length limit
                if (this.taskCache.getTasksLength() === MAX_TASK_LIST_LENGTH) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    return response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                // Continue processing if no entries are returned in the current batch
                if (entries.length === 0) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    return response.continue({
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
                    await this.taskCache.triggerTask(context, store.getTask());

                    return response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                    });
                }

                listEntriesParams.after = meta.cursor;
            }
        } catch (ex) {
            return response.error(ex.message ?? `Error while creating task.`);
        }
    }
}
