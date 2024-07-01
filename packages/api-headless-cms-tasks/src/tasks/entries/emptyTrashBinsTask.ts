import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { EntriesTask, HcmsTasksContext } from "~/types";

export const createEmptyTrashBinsTask = () => {
    return createTaskDefinition<HcmsTasksContext>({
        id: EntriesTask.EmptyTrashBins,
        title: "Headless CMS - Empty all trash bins",
        description:
            "Delete all entries found in the trash bin, for each model found in the system.",
        maxIterations: 1,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { EmptyTrashBins } = await import(
                    /* webpackChunkName: "EmptyTrashBins" */ "~/tasks/entries/useCases/EmptyTrashBins"
                );

                const emptyTrashBins = new EmptyTrashBins();
                return await emptyTrashBins.execute(params);
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing EmptyTrashBins task");
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
                console.error("Error while cleaning `EmptyTrashBins` child tasks.", ex);
            }
        }
    });
};
