import { IDeleteEntriesProcessEntriesTaskParams } from "~/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessEntriesDataManager } from "./ProcessEntriesDataManager";
import { CLOSE_TO_TIMEOUT_SECONDS } from "~/constants";

export class DeleteEntriesProcessEntries {
    public async execute(
        params: IDeleteEntriesProcessEntriesTaskParams
    ): Promise<ITaskResponseResult> {
        const { context, response, input, store, isAborted, isCloseToTimeout } = params;

        const parentId = store.getTask().parentId;
        if (!parentId) {
            return response.error({
                message: `Could not find parent task ID.`
            });
        }

        const model = await context.cms.getModel(input.modelId);

        if (!model) {
            return response.error(`Model with ${input.modelId} not found!`);
        }

        const dataManager = new ProcessEntriesDataManager(input);

        if (!dataManager.hasMore()) {
            return response.done("Task done.", {
                done: dataManager.getDone(),
                failed: dataManager.getFailed()
            });
        }

        for (const entry of dataManager.getEntries()) {
            /**
             * Check for a possibility that the task was aborted.
             */
            if (isAborted()) {
                return response.aborted();
            }
            /**
             * We need to check if there is enough time left to finish the task.
             */
            if (isCloseToTimeout(CLOSE_TO_TIMEOUT_SECONDS)) {
                /**
                 * If there is not enough time left, we will pause the task and return the current state.
                 */
                return response.continue(dataManager.getInput());
            }

            try {
                await context.cms.deleteEntry(model, entry.entryId, { permanently: true });
                dataManager.addDone(entry);
            } catch (ex) {
                const message =
                    ex.message || `Failed to delete entry with entryId ${entry.entryId}.`;

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

        return response.done("Task done.", {
            done: dataManager.getDone(),
            failed: dataManager.getFailed()
        });
    }
}
