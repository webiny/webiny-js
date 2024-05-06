import { ITaskResponseResult } from "@webiny/tasks";
import { parseIdentifier } from "@webiny/utils";
import { IBulkActionOperationTaskParams } from "~/types";
import { taskRepositoryFactory } from "~/tasks/entries/domain";
import { IUseCase } from "~/tasks/IUseCase";

export class MoveEntriesToTrash
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

            if (!input.ids || input.ids.length === 0) {
                return response.done(`Task done: no entries to move into trash bin.`);
            }

            const taskRepository = taskRepositoryFactory.getRepository(store.getTask().id);

            for (const id of input.ids) {
                const { id: entryId } = parseIdentifier(id);

                try {
                    context.security.setIdentity(input.identity);
                    await context.cms.deleteEntry(model, entryId, { permanently: false });
                    taskRepository.addDone(id);
                } catch (ex) {
                    const message =
                        ex.message ||
                        `Failed to move entry with entryId ${entryId} into the trash bin.`;

                    try {
                        await store.addErrorLog({
                            message,
                            error: ex
                        });
                    } catch {
                        console.error(`Failed to add error log: "${message}"`);
                    } finally {
                        taskRepository.addFailed(id);
                    }
                }
            }

            return response.done("Task done.", {
                done: taskRepository.getDone(),
                failed: taskRepository.getFailed()
            });
        } catch (ex) {
            return response.error(
                ex.message ?? `Error while moving entries to trash for model ${input.modelId}.`
            );
        }
    }
}
