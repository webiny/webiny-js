import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionMoveEntriesToFolderOperationInput,
    IBulkActionOperationOutput
} from "~/types";

export const createMoveEntriesToFolderTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IBulkActionMoveEntriesToFolderOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.MoveEntriesToFolder,
        title: "Headless CMS - Move entries to folder",
        description: "Move entries to folder.",
        maxIterations: 2,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { MoveEntriesToFolder } = await import(
                    /* webpackChunkName: "MoveEntriesToFolder" */ "~/tasks/entries/useCases/MoveEntriesToFolder"
                );

                const moveEntriesToFolder = new MoveEntriesToFolder();
                return await moveEntriesToFolder.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing MoveEntriesToFolder task"
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
                console.error("Error while cleaning `MoveEntriesToFolder` child tasks.", ex);
            }
        }
    });
};
