import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import {
    EntriesTask,
    IBulkActionMoveEntriesToFolderOperationInput,
    IMoveEntriesToFolderByModelTaskParams
} from "~/types";

const BATCH_SIZE = 50;
const WAITING_TIME = 5;

export class CreateTasks {
    public async execute(
        params: IMoveEntriesToFolderByModelTaskParams
    ): Promise<ITaskResponseResult> {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

        try {
            if (!input.folderId) {
                return response.error(`Missing "folderId" in the input.`);
            }

            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Model with ${input.modelId} not found!`);
            }

            const listEntriesParams: CmsEntryListParams = {
                where: {
                    latest: true,
                    ...input.where
                },
                after: input.after,
                limit: BATCH_SIZE
            };

            let currentBatch = input.currentBatch || 1;
            let hasMoreEntries = true;

            while (hasMoreEntries) {
                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    return response.continue({
                        ...input,
                        ...listEntriesParams,
                        currentBatch
                    });
                }

                const [entries, meta] = await context.cms.listEntries(model, listEntriesParams);

                hasMoreEntries = meta.hasMoreItems;
                listEntriesParams.after = meta.cursor;

                // If no entries exist for the provided query, let's return done.
                if (meta.totalCount === 0) {
                    return response.done("Task done: no entries to move.");
                }

                // If no entries are returned, let's continue with the task, but in `processing` mode.
                if (entries.length === 0) {
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

                const ids = entries.map(entry => entry.id);

                // Trigger a task for each of the loaded entries batch.
                if (ids.length > 0) {
                    await context.tasks.trigger<IBulkActionMoveEntriesToFolderOperationInput>({
                        definition: EntriesTask.MoveEntriesToFolder,
                        name: `Headless CMS - Move entries to folder "${input.folderId}" - ${model.name} - #${currentBatch}`,
                        parent: store.getTask(),
                        input: {
                            modelId: input.modelId,
                            identity: input.identity,
                            folderId: input.folderId,
                            ids
                        }
                    });
                }

                // If there are no more entries to load, we can continue the controller task in a `processing` mode, with some delay.
                if (!meta.hasMoreItems || !meta.cursor) {
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

            // Should not be possible to exit the loop without returning a response, but let's have a continue response here just in case.
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
            return response.error(
                ex.message ?? "Error while executing MoveEntriesToFolderByModel/CreateTasks"
            );
        }
    }
}
