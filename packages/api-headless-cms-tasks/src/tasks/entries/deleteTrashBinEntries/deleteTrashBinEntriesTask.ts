import { createTaskDefinition } from "@webiny/tasks";
import {
    EntriesTask,
    HeadlessCmsTasksContext,
    IDeleteTrashBinEntriesInput,
    IDeleteTrashBinEntriesOutput
} from "~/types";
import { DeleteEntriesDataManager } from "./DeleteEntriesDataManager";

export const createDeleteTrashBinEntriesTask = () => {
    return createTaskDefinition<
        HeadlessCmsTasksContext,
        IDeleteTrashBinEntriesInput,
        IDeleteTrashBinEntriesOutput
    >({
        id: EntriesTask.DeleteTrashBinEntries,
        title: "Headless CMS - Delete Trash Bin Entries",
        description: "Delete trash bin entries.",
        maxIterations: 500,
        run: async params => {
            const { input, response, isAborted, isCloseToTimeout, context, store } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                } else if (isCloseToTimeout()) {
                    return response.continue({
                        ...input
                    });
                }

                if (!input.modelId) {
                    return response.error(`Missing "modelId" in the input.`);
                }

                const model = await context.cms.getModel(input.modelId);

                if (!model) {
                    return response.error(`Model with ${input.modelId} not found!`);
                }

                if (!input.entryIds || input.entryIds.length === 0) {
                    return response.done("No entries to delete.");
                }

                const dataManager = new DeleteEntriesDataManager(input);

                for (const entryId of input.entryIds) {
                    try {
                        await context.cms.deleteEntry(model, entryId, {
                            permanently: true
                        });
                        dataManager.addDone(entryId);
                    } catch (ex) {
                        const message =
                            ex.message || `Failed to delete entry with entryId ${entryId}.`;

                        try {
                            await store.addErrorLog({
                                message,
                                error: ex
                            });
                        } catch {
                            console.error(`Failed to add error log: "${message}"`);
                        } finally {
                            dataManager.addFailed(entryId);
                        }
                    }
                }

                return response.done("Task done.", {
                    done: dataManager.getDone(),
                    failed: dataManager.getFailed()
                });
            } catch (ex) {
                return response.error(
                    ex.message ??
                        `Error while deleting entries found in the trash bin for model ${input.modelId}.`
                );
            }
        }
    });
};
