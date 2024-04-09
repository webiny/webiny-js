import { createTaskDefinition } from "@webiny/tasks";
import { EntriesTask, HeadlessCmsTasksContext } from "~/types";

export const createEmptyTrashBinsTask = () => {
    return createTaskDefinition<HeadlessCmsTasksContext>({
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
                    /* webpackChunkName: "EmptyTrashBins" */ "~/useCases/entries/EmptyTrashBins"
                );

                const emptyTrashBins = new EmptyTrashBins();
                return await emptyTrashBins.execute(params);
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing EmptyTrashBins task");
            }
        }
    });
};
