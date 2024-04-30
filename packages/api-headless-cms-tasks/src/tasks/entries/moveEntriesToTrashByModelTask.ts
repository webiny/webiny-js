import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
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
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { MoveEntriesToTrashByModel } = await import(
                    /* webpackChunkName: "MoveEntriesToTrashByModel" */ "~/tasks/entries/useCases/MoveEntriesToTrashByModel"
                );

                const moveEntriesToTrashByModel = new MoveEntriesToTrashByModel();
                return await moveEntriesToTrashByModel.execute(params);
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
