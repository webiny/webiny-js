import { ITaskResponseResult } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { EntriesTask, IPublishEntriesByModelTaskParams, IPublishEntriesInput } from "~/types";

const PUBLISH_ENTRIES_IN_BATCH = 50;
const PUBLISH_ENTRIES_WAIT_TIME = 5;

export class CreatePublishEntriesTasks {
    public async execute(params: IPublishEntriesByModelTaskParams): Promise<ITaskResponseResult> {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

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
                    limit: PUBLISH_ENTRIES_IN_BATCH
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
                                seconds: PUBLISH_ENTRIES_WAIT_TIME
                            }
                        );
                    }

                    return response.done("Task done: no entries to publish.");
                }

                const ids = entries.map(entry => entry.id);

                if (ids.length > 0) {
                    await context.tasks.trigger<IPublishEntriesInput>({
                        definition: EntriesTask.PublishEntries,
                        name: `Headless CMS - Publish entries - ${model.name} - #${currentBatch}`,
                        parent: store.getTask(),
                        input: {
                            modelId: input.modelId,
                            identity: input.identity,
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
                    seconds: PUBLISH_ENTRIES_WAIT_TIME
                }
            );
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing CreatePublishEntriesTasks");
        }
    }
}
