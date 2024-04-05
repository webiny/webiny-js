import { createTaskDefinition } from "@webiny/tasks";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import {
    EntriesTask,
    HeadlessCmsTasksContext,
    IEmptyTrashBinByModelInput,
    IEmptyTrashBinByModelOutput
} from "~/types";
import { ProcessEntriesDataManager } from "./ProcessEntriesDataManager";

const DELETE_ENTRIES_IN_BATCH = 50;

export const createEmptyTrashBinByModelTask = () => {
    return createTaskDefinition<
        HeadlessCmsTasksContext,
        IEmptyTrashBinByModelInput,
        IEmptyTrashBinByModelOutput
    >({
        id: EntriesTask.EmptyTrashBinByModel,
        title: "Headless CMS - Empty trash bin by model",
        description: "Delete all entries found in the trash bin, by model.",
        maxIterations: 2,
        run: async params => {
            const { input, response, isAborted, isCloseToTimeout, context, store } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                if (!input.modelId) {
                    return response.error(`Missing "modelId" in the input.`);
                }

                const model = await context.cms.getModel(input.modelId);

                if (!model) {
                    return response.error(`Model with ${input.modelId} not found!`);
                }

                const listEntriesParams: CmsEntryListParams = {
                    where: input.where,
                    limit: DELETE_ENTRIES_IN_BATCH
                };

                const dataManager = new ProcessEntriesDataManager();

                let shouldContinue = true;

                while (shouldContinue) {
                    const [entries, meta] = await context.cms.listDeletedEntries(
                        model,
                        listEntriesParams
                    );

                    if (isAborted()) {
                        return response.aborted();
                    } else if (isCloseToTimeout()) {
                        return response.continue({
                            ...input,
                            ...listEntriesParams
                        });
                    }

                    if (meta.totalCount === 0) {
                        return response.done("No entries to delete.");
                    }

                    for (const entry of entries) {
                        if (isAborted()) {
                            return response.aborted();
                        }

                        if (isCloseToTimeout()) {
                            return response.continue({
                                ...input,
                                ...listEntriesParams
                            });
                        }

                        try {
                            await context.cms.deleteEntry(model, entry.entryId, {
                                permanently: true
                            });
                            dataManager.addDone(entry);
                        } catch (ex) {
                            const message =
                                ex.message ||
                                `Failed to delete entry with entryId ${entry.entryId}.`;

                            try {
                                await store.addErrorLog({
                                    message,
                                    error: ex
                                });
                            } catch {
                                console.error(`Failed to add error log: "${message}"`);
                            }
                            dataManager.addFailed(entry);
                        }
                    }

                    if (!meta.hasMoreItems || !meta.cursor) {
                        shouldContinue = false;
                    }
                }

                return response.done("Task done.", {
                    done: dataManager.getDone(),
                    failed: dataManager.getFailed()
                });
            } catch (ex) {
                return response.error(
                    ex.message ?? `Error while emptying trash bin for model ${input.modelId}.`
                );
            }
        }
    });
};
