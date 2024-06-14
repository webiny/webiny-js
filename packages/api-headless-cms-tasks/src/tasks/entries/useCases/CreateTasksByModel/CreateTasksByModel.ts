import { ITaskResponseResult } from "@webiny/tasks";
import { IListEntries } from "~/tasks/entries/gateways";
import { TaskCache } from "./TaskCache";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";

const BATCH_SIZE = 50; // Number of entries to fetch in each batch
const WAITING_TIME = 5; // Time to wait in seconds before retrying

/**
 * TaskCreate class handles the execution of a task to process entries in batches.
 */
export class CreateTasksByModel {
    private readonly taskCache: TaskCache;
    private listEntriesGateway: IListEntries;

    constructor(taskDefinition: EntriesTask, listEntriesGateway: IListEntries) {
        this.taskCache = new TaskCache(taskDefinition);
        this.listEntriesGateway = listEntriesGateway;
    }

    async execute(params: IBulkActionOperationByModelTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        try {
            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                search: input.search,
                after: input.after,
                limit: BATCH_SIZE
            };

            let currentBatch = input.currentBatch || 1;

            while (true) {
                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    return response.continue({
                        ...input,
                        ...listEntriesParams,
                        currentBatch
                    });
                }

                // List entries from the HCMS based on the provided query
                const { entries, meta } = await this.listEntriesGateway.execute(
                    context,
                    input.modelId,
                    listEntriesParams
                );

                // End the task if no entries match the query
                if (meta.totalCount === 0) {
                    return response.done(
                        `Task done: no entries found for model "${input.modelId}", skipping task creation.`
                    );
                }

                // Continue processing if no entries are returned in the current batch
                if (entries.length === 0) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    return response.continue(
                        {
                            ...input,
                            ...listEntriesParams,
                            currentBatch,
                            totalCount: meta.totalCount,
                            processing: true
                        },
                        { seconds: WAITING_TIME }
                    );
                }

                const ids = entries.map(entry => entry.id); // Extract entry IDs

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
                    return response.continue(
                        {
                            ...input,
                            ...listEntriesParams,
                            currentBatch,
                            totalCount: meta.totalCount,
                            processing: true
                        },
                        { seconds: WAITING_TIME }
                    );
                }

                listEntriesParams.after = meta.cursor;
                currentBatch++;
            }
        } catch (ex) {
            throw new Error(ex.message ?? `Error while creating task.`);
        }
    }
}
