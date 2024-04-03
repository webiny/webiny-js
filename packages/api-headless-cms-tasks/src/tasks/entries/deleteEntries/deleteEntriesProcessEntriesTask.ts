import { createTaskDefinition } from "@webiny/tasks";
import {
    DeleteEntriesTask,
    HeadlessCmsTasksContext,
    IDeleteEntriesProcessEntriesInput,
    IDeleteEntriesProcessEntriesOutput
} from "~/types";

export const createDeleteEntriesProcessEntriesTask = () => {
    return createTaskDefinition<
        HeadlessCmsTasksContext,
        IDeleteEntriesProcessEntriesInput,
        IDeleteEntriesProcessEntriesOutput
    >({
        id: DeleteEntriesTask.Process,
        title: "Headless CMS - Delete Entries - Process Entries",
        description: "Process entries deleting them",
        maxIterations: 20,
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { DeleteEntriesProcessEntries } = await import(
                /* webpackChunkName: "DeleteEntriesProcessEntries" */ "~/tasks/entries/deleteEntries/processEntries/DeleteEntriesProcessEntries"
            );

            const deleteEntries = new DeleteEntriesProcessEntries();

            return await deleteEntries.execute(params);
        }
    });
};
