import { ITaskResponseResult } from "@webiny/tasks";
import { IBulkActionOperationTaskParams } from "~/types";
import { taskRepositoryFactory } from "~/tasks/entries/domain";
import { IUseCase } from "~/tasks/IUseCase";

export class RestoreEntriesFromTrash
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

            if (!input.identity) {
                return response.error(`Missing "identity" in the input.`);
            }

            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Content model "${input.modelId}" was not found!`);
            }

            if (!input.entryIds || input.entryIds.length === 0) {
                return response.done(`Task done: no entries to restore from trash bin.`);
            }

            const taskRepository = taskRepositoryFactory.getRepository(store.getTask().id);

            for (const entryId of input.entryIds) {
                try {
                    context.security.setIdentity(input.identity);
                    await context.cms.restoreEntryFromBin(model, entryId);
                    taskRepository.addDone(entryId);
                } catch (ex) {
                    const message =
                        ex.message ||
                        `Failed to restore entry with entryId ${entryId} from the trash bin.`;

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
                    `Error while restoring entries from trash bin for model ${input.modelId}.`
            );
        }
    }
}
