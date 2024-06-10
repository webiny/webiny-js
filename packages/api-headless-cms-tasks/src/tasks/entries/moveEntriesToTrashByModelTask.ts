import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { TaskCreate, TaskProcess } from "~/tasks/entries/domain";
import { ListLatestEntries } from "~/tasks/entries/gateways";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
} from "~/types";

export const createMoveEntriesToTrashByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    >({
        id: EntriesTask.MoveEntriesToTrashByModel,
        title: "Headless CMS - Move entries to trash bin by model",
        description: "Move entries to trash bin found for a particular query, by model.",
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
                    const processTasks = new TaskProcess(EntriesTask.MoveEntriesToTrash);
                    return await processTasks.execute(params);
                }

                const listGateway = new ListLatestEntries();
                const createTasks = new TaskCreate(EntriesTask.MoveEntriesToTrash, listGateway);
                return await createTasks.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing MoveEntriesToTrashByModel task"
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
                console.error("Error while cleaning `MoveEntriesToTrashByModel` child tasks.", ex);
            }
        }
    });
};
