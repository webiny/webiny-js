import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { CreateTasksByModel, ProcessTasksByModel } from "~/tasks/entries/useCases";
import { ListDeletedEntries } from "~/tasks/entries/gateways";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
} from "~/types";

export const createRestoreEntriesFromTrashByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    >({
        id: EntriesTask.RestoreEntriesFromTrashByModel,
        title: "Headless CMS - Restore entries from trash bin by model",
        description: "Restore entries from trash bin found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted, input } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                if (!input.modelId) {
                    return response.error(`Missing "modelId" in the input.`);
                }

                if (input.processing) {
                    const processTasks = new ProcessTasksByModel(
                        EntriesTask.RestoreEntriesFromTrash
                    );
                    return await processTasks.execute(params);
                }

                const listGateway = new ListDeletedEntries();
                const createTasks = new CreateTasksByModel(
                    EntriesTask.RestoreEntriesFromTrash,
                    listGateway
                );
                return await createTasks.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing RestoreEntriesFromTrashByModel task"
                );
            }
        },
        onDone: async ({ context, task }) => {
            /**
             * We want to clean all child tasks and logs, which have no errors.
             */
            const childTasksCleanup = new ChildTasksCleanup();
            try {
                await childTasksCleanup.execute({
                    context,
                    task
                });
            } catch (ex) {
                console.error(
                    "Error while cleaning `RestoreEntriesFromTrashByModel` child tasks.",
                    ex
                );
            }
        }
    });
};
