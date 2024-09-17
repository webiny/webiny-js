import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCache } from "./TaskCache";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { IListEntries } from "~/abstractions";
import { BulkActionOperationByModelAction, IBulkActionOperationByModelTaskParams } from "~/types";

const WAITING_TIME = 30; // Time to wait in seconds before retrying

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
                } else if (isCloseToTimeout(720)) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    console.log("CreateTasksByModel", "response.continue -> isCloseToTimeout");
                    return response.continue(
                        {
                            ...input,
                            ...listEntriesParams,
                            after: null,
                            action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                        },
                        { seconds: WAITING_TIME }
                    );
                }

                // List entries from the HCMS based on the provided query
                const { entries, meta } = await this.listEntriesGateway.execute(
                    input.modelId,
                    listEntriesParams
                );

                // End the task if no entries match the query
                if (meta.totalCount === 0) {
                    console.log("CreateTasksByModel", "meta.totalCount === 0", input);
                    return response.continue({
                        ...input,
                        action: BulkActionOperationByModelAction.END_TASK
                    });
                }

                // Continue processing if no entries are returned in the current batch
                if (entries.length === 0) {
                    await this.taskCache.triggerTask(context, store.getTask());
                    console.log("CreateTasksByModel", "response.continue -> entries.length === 0");
                    return response.continue(
                        {
                            ...input,
                            ...listEntriesParams,
                            totalCount: meta.totalCount,
                            action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                        },
                        { seconds: WAITING_TIME }
                    );
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
                    console.log(
                        "CreateTasksByModel",
                        "response.continue -> !meta.hasMoreItems || !meta.cursor"
                    );
                    return response.continue(
                        {
                            ...input,
                            after: null,
                            totalCount: meta.totalCount,
                            action: BulkActionOperationByModelAction.PROCESS_SUBTASKS
                        },
                        { seconds: WAITING_TIME }
                    );
                }

                listEntriesParams.after = meta.cursor;
            }
        } catch (ex) {
            return response.error(ex.message ?? `Error while creating task.`);
        }
    }
}
