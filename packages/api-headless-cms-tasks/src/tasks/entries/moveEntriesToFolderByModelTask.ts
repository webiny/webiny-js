import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IMoveEntriesToFolderByModelInput,
    IMoveEntriesToFolderByModelOutput
} from "~/types";

export const createMoveEntriesToFolderByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IMoveEntriesToFolderByModelInput,
        IMoveEntriesToFolderByModelOutput
    >({
        id: EntriesTask.MoveEntriesToFolderByModel,
        title: "Headless CMS - Move entries to folder by model",
        description: "Move entries to folder found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { MoveEntriesToFolderByModel } = await import(
                    /* webpackChunkName: "MoveEntriesToFolderByModel" */ "~/tasks/entries/useCases/MoveEntriesToFolderByModel"
                );

                const moveEntriesToFolderByModel = new MoveEntriesToFolderByModel();
                return await moveEntriesToFolderByModel.execute(params);
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
