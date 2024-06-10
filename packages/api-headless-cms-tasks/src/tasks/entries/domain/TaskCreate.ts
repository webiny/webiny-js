import { TaskCache } from "./TaskCache";
import { TaskTrigger } from "./TaskTrigger";
import {
    EntriesTask,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelTaskParams,
    IBulkActionOperationInput
} from "~/types";
import { IListEntries } from "~/tasks/entries/gateways";
import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";

const BATCH_SIZE = 50;
const WAITING_TIME = 5;

export class TaskCreate {
    private readonly taskCache: TaskCache<IBulkActionOperationInput>;
    private taskTrigger: TaskTrigger<IBulkActionOperationInput, IBulkActionOperationByModelInput>;
    private listEntriesGateway: IListEntries;

    constructor(taskDefinition: EntriesTask, listEntriesGateway: IListEntries) {
        console.log("taskDefinition", taskDefinition);

        this.taskCache = new TaskCache<IBulkActionOperationInput>();
        this.taskTrigger = new TaskTrigger<
            IBulkActionOperationInput,
            IBulkActionOperationByModelInput
        >(this.taskCache, taskDefinition);
        this.listEntriesGateway = listEntriesGateway;
    }

    async execute(params: IBulkActionOperationByModelTaskParams): Promise<ITaskResponseResult> {
        const { response, input, isAborted, isCloseToTimeout, context, store } = params;

        try {
            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                after: input.after,
                limit: BATCH_SIZE
            };

            console.log("listEntriesParams", listEntriesParams);

            let currentBatch = input.currentBatch || 1;

            while (true) {
                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    console.log("taskTrigger.execute 1");

                    await this.taskTrigger.execute(context, store);
                    return response.continue({
                        ...input,
                        ...listEntriesParams,
                        currentBatch
                    });
                }

                const { entries, meta } = await this.listEntriesGateway.execute(
                    context,
                    input.modelId,
                    listEntriesParams
                );

                console.log("entries", entries);
                console.log("meta", meta);

                // If no entries exist for the provided query, let's return done.
                if (meta.totalCount === 0) {
                    return response.done("Task done: no entries to process.");
                }

                // If no entries are returned, let's trigger the cached child tasks and continue in `processing` mode.
                if (entries.length === 0) {
                    console.log("taskTrigger.execute 2");

                    await this.taskTrigger.execute(context, store);
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

                const ids = entries.map(entry => entry.id);

                if (ids.length > 0) {
                    console.log("cacheTask", ids);

                    this.taskCache.cacheTask({
                        modelId: input.modelId,
                        identity: input.identity,
                        ids
                    });
                }

                // No more entries paginated, let's trigger the cached child tasks and continue in `processing` mode.
                if (!meta.hasMoreItems || !meta.cursor) {
                    console.log("taskTrigger.execute 3");
                    await this.taskTrigger.execute(context, store);
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
