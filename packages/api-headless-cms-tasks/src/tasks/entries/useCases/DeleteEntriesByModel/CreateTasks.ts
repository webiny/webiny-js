import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { EntriesTask, IBulkActionOperationInput, IDeleteEntriesByModelTaskParams } from "~/types";

const BATCH_SIZE = 50;
const WAITING_TIME = 5;

export class CreateTasks {
    public async execute(params: IDeleteEntriesByModelTaskParams): Promise<ITaskResponseResult> {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

        try {
            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Model with ${input.modelId} not found!`);
            }

            const totalCount = input.totalCount || 0;
            let currentBatch = input.currentBatch || 1;
            let hasMoreEntries = true;

            while (hasMoreEntries) {
                const listEntriesParams: CmsEntryListParams = {
                    where: input.where,
                    after: input.after,
                    limit: BATCH_SIZE
                };

                const [entries, meta] = await context.cms.listDeletedEntries(
                    model,
                    listEntriesParams
                );

                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    return response.continue({
                        ...input,
                        ...listEntriesParams,
                        currentBatch
                    });
                }

                if (meta.totalCount === 0) {
                    if (totalCount > 0) {
                        return response.continue(
                            {
                                ...input,
                                ...listEntriesParams,
                                currentBatch,
                                processing: true
                            },
                            {
                                seconds: WAITING_TIME
                            }
                        );
                    }

                    return response.done("Task done: No entries to delete.");
                }

                const entryIds = entries.map(entry => entry.entryId);

                if (entryIds.length > 0) {
                    await context.tasks.trigger<IBulkActionOperationInput>({
                        definition: EntriesTask.DeleteEntries,
                        name: `Headless CMS - Delete Entries - ${model.name} - #${currentBatch}`,
                        parent: store.getTask(),
                        input: {
                            modelId: input.modelId,
                            identity: input.identity,
                            entryIds
                        }
                    });
                }

                hasMoreEntries = meta.hasMoreItems;
                input.after = meta.cursor;
                input.totalCount = meta.totalCount;
                currentBatch++;
            }

            return response.continue(
                {
                    ...input,
                    currentBatch
                },
                {
                    seconds: WAITING_TIME
                }
            );
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing DeleteEntriesByModel/CreateTasks"
            );
        }
    }
}
