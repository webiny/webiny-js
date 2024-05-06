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
            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Model with ${input.modelId} not found!`);
            }

            const totalCount = input.totalCount || 0;
            let currentBatch = input.currentBatch || 1;
            let hasMoreEntries = true;

            while (hasMoreEntries) {
                const listEntriesParams: CmsEntryListParams = {
                    where: {
                        latest: true,
                        ...input.where
                    },
                    after: input.after,
                    limit: BATCH_SIZE
                };

                const [entries, meta] = await context.cms.listEntries(model, listEntriesParams);

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

                    return response.done(
                        `Task done: no entries to move to folder "${input.folderId}".`
                    );
                }

                const ids = entries.map(entry => entry.id);

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
                ex.message ?? "Error while executing MoveEntriesToFolderByModel/CreateTasks"
            );
        }
    }
}
