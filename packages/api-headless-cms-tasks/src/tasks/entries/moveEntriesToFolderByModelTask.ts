import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { CreateTasksByModel, ProcessTasksByModel } from "~/tasks/entries/useCases";
import { ListLatestEntries } from "~/tasks/entries/gateways";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
} from "~/types";

export const createMoveEntriesToFolderByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    >({
        id: EntriesTask.MoveEntriesToFolderByModel,
        title: "Headless CMS - Move entries to folder by model",
        description: "Move entries to folder found for a particular query, by model.",
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

                if (!input?.data?.folderId) {
                    return response.error(`Missing "folderId" in the input.`);
                }

                if (input.processing) {
                    const processTasks = new ProcessTasksByModel(EntriesTask.MoveEntriesToFolder);
                    return await processTasks.execute(params);
                }

                const listGateway = new ListLatestEntries();
                const createTasks = new CreateTasksByModel(
                    EntriesTask.MoveEntriesToFolder,
                    listGateway
                );
                return await createTasks.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing MoveEntriesToFolderByModel task"
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
                console.error("Error while cleaning `MoveEntriesToFolderByModel` child tasks.", ex);
            }
        }
    });
};
