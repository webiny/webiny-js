import { ITaskResponseResult } from "@webiny/tasks";
import { IBulkActionOperationTaskParams } from "~/types";
import { taskRepositoryFactory } from "~/tasks/entries/domain";
import { IUseCase } from "~/tasks/IUseCase";

export class DeleteEntries
    implements IUseCase<IBulkActionOperationTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationTaskParams) {
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
                return response.done("Task done: no entries to delete.");
            }

            const taskRepository = taskRepositoryFactory.getRepository(store.getTask().id);

            for (const entryId of input.entryIds) {
                try {
                    await context.cms.deleteEntry(model, entryId, {
                        permanently: true
                    });
                    taskRepository.addDone(entryId);
                } catch (ex) {
                    const message = ex.message || `Failed to delete entry with entryId ${entryId}.`;

                    try {
                        await store.addErrorLog({
                            message,
                            error: ex
                        });
                    } catch {
                        console.error(`Failed to add error log: "${message}"`);
                    } finally {
                        taskRepository.addFailed(entryId);
                    }
                }
            }

            return response.done("Task done.", {
                done: taskRepository.getDone(),
                failed: taskRepository.getFailed()
            });
        } catch (ex) {
            return response.error(
                ex.message ??
                    `Error while deleting entries found in the trash bin for model ${input.modelId}.`
            );
        }
    }
}
