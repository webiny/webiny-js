import {
    DeleteEntriesTask,
    IDeleteEntriesControllerTaskParams,
    IDeleteEntriesProcessEntriesInput
} from "~/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntry, CmsEntryListParams, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import { DELETE_ENTRIES_IN_BATCH, DELETE_ENTRIES_WAIT_TIME } from "~/constants";

export class CreateDeleteEntriesTasks {
    public async execute(params: IDeleteEntriesControllerTaskParams): Promise<ITaskResponseResult> {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

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
            limit: DELETE_ENTRIES_IN_BATCH
        };

        let currentBatch = input.currentBatch || 1;

        let result: [CmsEntry[], CmsEntryMeta];

        while ((result = await context.cms.listDeletedEntries(model, listEntriesParams))) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input,
                    ...listEntriesParams,
                    currentBatch
                });
            }
            const [entries, meta] = result;

            listEntriesParams.after = meta.cursor;
            /**
             * If no entries are returned there are two options:
             * * mark task as done because there are no entries at all
             * * continue with the control task, but in processing mode
             */
            if (meta.totalCount === 0) {
                return response.done("No entries to delete.");
            } else if (entries.length === 0) {
                return response.continue(
                    {
                        ...input,
                        ...listEntriesParams,
                        currentBatch,
                        totalEntries: meta.totalCount,
                        processing: true
                    },
                    {
                        seconds: DELETE_ENTRIES_WAIT_TIME
                    }
                );
            }

            /**
             * Trigger a `Process` task for each of the loaded entries batch.
             */
            await context.tasks.trigger<IDeleteEntriesProcessEntriesInput>({
                name: `Headless CMS - Delete entries - Delete #${currentBatch} batch`,
                parent: store.getTask(),
                definition: DeleteEntriesTask.Process,
                input: {
                    modelId: input.modelId,
                    entries
                }
            });

            /**
             * If there are no more entries to load, we can continue the controller task in a processing mode, with some delay.
             */
            if (!meta.hasMoreItems || !meta.cursor) {
                return response.continue(
                    {
                        ...input,
                        ...listEntriesParams,
                        currentBatch,
                        totalEntries: meta.totalCount,
                        processing: true
                    },
                    {
                        seconds: DELETE_ENTRIES_WAIT_TIME
                    }
                );
            }

            currentBatch++;
        }

        /**
         * Should not be possible to exit the loop without returning a response, but let's have a continue response here just in case.
         */
        return response.continue(
            {
                ...input,
                ...listEntriesParams,
                currentBatch
            },
            {
                seconds: DELETE_ENTRIES_WAIT_TIME
            }
        );
    }
}
