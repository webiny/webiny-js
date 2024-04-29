import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IRestoreEntriesFromTrashInput,
    IRestoreEntriesFromTrashOutput
} from "~/types";

export const createRestoreEntriesFromTrashTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IRestoreEntriesFromTrashInput,
        IRestoreEntriesFromTrashOutput
    >({
        id: EntriesTask.RestoreEntriesFromTrash,
        title: "Headless CMS - Restore entries from trash bin",
        description: "Restore entries from trash bin.",
        maxIterations: 2,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { RestoreEntriesFromTrash } = await import(
                    /* webpackChunkName: "RestoreEntriesFromTrash" */ "~/tasks/entries/useCases/RestoreEntriesFromTrash"
                );

                const restoreEntriesFromTrash = new RestoreEntriesFromTrash();
                return await restoreEntriesFromTrash.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing RestoreEntriesFromTrash task"
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
                console.error("Error while cleaning `RestoreEntriesFromTrash` child tasks.", ex);
            }
        }
    });
};
