import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IMoveEntriesToTrashInput,
    IMoveEntriesToTrashOutput
} from "~/types";

export const createMoveEntriesToTrashTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IMoveEntriesToTrashInput,
        IMoveEntriesToTrashOutput
    >({
        id: EntriesTask.MoveEntriesToTrash,
        title: "Headless CMS - Move entries to trash bin",
        description: "Move entries to trash bin.",
        maxIterations: 2,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { MoveEntriesToTrash } = await import(
                    /* webpackChunkName: "MoveEntriesToTrash" */ "~/tasks/entries/useCases/MoveEntriesToTrash"
                );

                const moveEntriesToTrash = new MoveEntriesToTrash();
                return await moveEntriesToTrash.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing MoveEntriesToTrash task"
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
                console.error("Error while cleaning `MoveEntriesToTrash` child tasks.", ex);
            }
        }
    });
};
