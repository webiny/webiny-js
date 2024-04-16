import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IDeleteTrashBinEntriesInput,
    IDeleteTrashBinEntriesOutput
} from "~/types";

export const createDeleteTrashBinEntriesTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IDeleteTrashBinEntriesInput,
        IDeleteTrashBinEntriesOutput
    >({
        id: EntriesTask.DeleteTrashBinEntries,
        title: "Headless CMS - Delete Trash Bin Entries",
        description: "Delete trash bin entries.",
        maxIterations: 2,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { DeleteTrashBinEntries } = await import(
                    /* webpackChunkName: "DeleteTrashBinEntries" */ "~/tasks/entries/useCases/DeleteTrashBinEntries"
                );

                const deleteTrashBinEntries = new DeleteTrashBinEntries();
                return await deleteTrashBinEntries.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing DeleteTrashBinEntries task"
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
                console.error("Error while cleaning `DeleteTrashBinEntries` child tasks.", ex);
            }
        }
    });
};
