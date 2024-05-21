import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { TaskCache } from "./TaskCache";
import { TaskTrigger } from "./TaskTrigger";
import { IEmptyTrashBinByModelTaskParams } from "~/types";

const BATCH_SIZE = 50;
const WAITING_TIME = 5;

export class CreateDeleteEntriesTasks {
    private taskCache = new TaskCache();
    private taskTrigger = new TaskTrigger(this.taskCache);

    public async execute(params: IEmptyTrashBinByModelTaskParams): Promise<ITaskResponseResult> {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Model with ${input.modelId} not found!`);
            }

            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                after: input.after,
                limit: BATCH_SIZE
            };

            let currentBatch = input.currentBatch || 1;
            let hasMoreEntries = true;

            while (hasMoreEntries) {
                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    await this.taskTrigger.execute(context, store);
                    return response.continue({
                        ...input,
                        ...listEntriesParams,
                        currentBatch
                    });
                }

                const [entries, meta] = await context.cms.listDeletedEntries(
                    model,
                    listEntriesParams
                );

                hasMoreEntries = meta.hasMoreItems;
                listEntriesParams.after = meta.cursor;

                // If no entries exist for the provided query, let's return done.
                if (meta.totalCount === 0) {
                    return response.done("Task done: no entries to delete.");
                }

                // If no entries are returned, let's continue with the task, but in `processing` mode.
                if (entries.length === 0) {
                    await this.taskTrigger.execute(context, store);
                    return response.continue(
                        {
                            ...input,
                            ...listEntriesParams,
                            currentBatch,
                            totalCount: meta.totalCount,
                            processing: true
                        },
                        {
                            seconds: WAITING_TIME
                        }
                    );
                }

                const entryIds = entries.map(entry => entry.id);

                if (entryIds.length > 0) {
                    this.taskCache.cacheTask(input.modelId, entryIds);
                }

                if (!meta.hasMoreItems || !meta.cursor) {
                    await this.taskTrigger.execute(context, store);
                    return response.continue(
                        {
                            ...input,
                            ...listEntriesParams,
                            currentBatch,
                            totalCount: meta.totalCount,
                            processing: true
                        },
                        {
                            seconds: WAITING_TIME
                        }
                    );
                }

                currentBatch++;
            }

            await this.taskTrigger.execute(context, store);
            return response.continue(
                {
                    ...input,
                    ...listEntriesParams,
                    currentBatch
                },
                {
                    seconds: WAITING_TIME
                }
            );
        } catch (ex) {
            console.error("Error while executing CreateDeleteEntriesTasks:", ex);
            return response.error(ex.message ?? "Error while executing CreateDeleteEntriesTasks");
        }
    }
}
