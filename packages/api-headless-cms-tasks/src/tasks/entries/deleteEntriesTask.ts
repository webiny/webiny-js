import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { EntriesTask, HcmsTasksContext, IDeleteEntriesInput, IDeleteEntriesOutput } from "~/types";

export const createDeleteEntriesTask = () => {
    return createPrivateTaskDefinition<HcmsTasksContext, IDeleteEntriesInput, IDeleteEntriesOutput>(
        {
            id: EntriesTask.DeleteEntries,
            title: "Headless CMS - Delete entries",
            description: "Delete entries.",
            maxIterations: 2,
            run: async params => {
                const { response, isAborted } = params;

                try {
                    if (isAborted()) {
                        return response.aborted();
                    }

                    const { DeleteEntries } = await import(
                        /* webpackChunkName: "DeleteEntries" */ "~/tasks/entries/useCases/DeleteEntries"
                    );

                    const deleteEntries = new DeleteEntries();
                    return await deleteEntries.execute(params);
                } catch (ex) {
                    return response.error(ex.message ?? "Error while executing DeleteEntries task");
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
                    console.error("Error while cleaning `DeleteEntries` child tasks.", ex);
                }
            }
        }
    );
};
