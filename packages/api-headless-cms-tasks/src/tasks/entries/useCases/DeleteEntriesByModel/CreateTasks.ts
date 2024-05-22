import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { TaskCache } from "./TaskCache";
import { TaskTrigger } from "./TaskTrigger";
import { IBulkActionOperationByModelTaskParams } from "~/types";

const BATCH_SIZE = 50;
const WAITING_TIME = 5;

export class CreateTasks {
    private taskCache = new TaskCache();
    private taskTrigger = new TaskTrigger(this.taskCache);

    public async execute(
        params: IBulkActionOperationByModelTaskParams
    ): Promise<ITaskResponseResult> {
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

            while (true) {
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

                // If no entries exist for the provided query, let's return done.
                if (meta.totalCount === 0) {
                    return response.done(
                        `Task done: no entries to delete for the "${input.modelId}" model.`
                    );
                }

                // If no entries are returned, let's trigger the cached child tasks and continue in `processing` mode.
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
                        { seconds: WAITING_TIME }
                    );
                }

                const entryIds = entries.map(entry => entry.id);

                if (entryIds.length > 0) {
                    this.taskCache.cacheTask(input.modelId, entryIds, input.identity);
                }

                // No more entries paginated, let's trigger the cached child tasks and continue in `processing` mode.
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
                        { seconds: WAITING_TIME }
                    );
                }

                listEntriesParams.after = meta.cursor;
                currentBatch++;
            }
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing DeleteEntriesByModel/CreateTasks"
            );
        }
    }
}
