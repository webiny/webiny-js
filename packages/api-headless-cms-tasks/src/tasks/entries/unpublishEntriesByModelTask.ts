import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IUnpublishEntriesByModelInput,
    IUnpublishEntriesByModelOutput
} from "~/types";

export const createUnpublishEntriesByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IUnpublishEntriesByModelInput,
        IUnpublishEntriesByModelOutput
    >({
        id: EntriesTask.UnpublishEntriesByModel,
        title: "Headless CMS - Unpublish entries by model",
        description: "Unpublish entries found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { UnpublishEntriesByModel } = await import(
                    /* webpackChunkName: "UnpublishEntriesByModel" */ "~/tasks/entries/useCases/UnpublishEntriesByModel"
                );

                const unpublishEntriesByModel = new UnpublishEntriesByModel();
                return await unpublishEntriesByModel.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing UnpublishEntriesByModel task"
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
                console.error("Error while cleaning `UnpublishEntriesByModel` child tasks.", ex);
            }
        }
    });
};
