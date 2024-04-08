import { EntriesTask, IDeleteTrashBinEntriesInput, IEmptyTrashBinByModelTaskParams } from "~/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";

const DELETE_ENTRIES_IN_BATCH = 50;
const DELETE_ENTRIES_WAIT_TIME = 5;

export class CreateDeleteEntriesTasks {
    public async execute(params: IEmptyTrashBinByModelTaskParams): Promise<ITaskResponseResult> {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

        const model = await context.cms.getModel(input.modelId);

        if (!model) {
            return response.error(`Model with ${input.modelId} not found!`);
        }

        let currentBatch = input.currentBatch || 1;
        const totalCount = input.totalCount || 0;
        let hasMoreEntries = true;

        while (hasMoreEntries) {
            const listEntriesParams: CmsEntryListParams = {
                where: input.where,
                after: input.after,
                limit: DELETE_ENTRIES_IN_BATCH
            };

            const [entries, meta] = await context.cms.listDeletedEntries(model, listEntriesParams);

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
                            seconds: DELETE_ENTRIES_WAIT_TIME
                        }
                    );
                }

                return response.done("No entries to delete.");
            }

            const entryIds = entries.map(entry => entry.entryId);

            if (entryIds.length > 0) {
                await context.tasks.trigger<IDeleteTrashBinEntriesInput>({
                    definition: EntriesTask.DeleteTrashBinEntries,
                    name: `Headless CMS - Delete Entries - ${model.name} - #${currentBatch}`,
                    parent: store.getTask(),
                    input: {
                        modelId: input.modelId,
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
                seconds: DELETE_ENTRIES_WAIT_TIME
            }
        );
    }
}
