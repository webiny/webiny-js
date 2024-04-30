import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IDeleteEntriesByModelInput,
    IDeleteEntriesByModelOutput
} from "~/types";

export const createDeleteEntriesByModelTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IDeleteEntriesByModelInput,
        IDeleteEntriesByModelOutput
    >({
        id: EntriesTask.DeleteEntriesByModel,
        title: "Headless CMS - Delete entries by model",
        description: "Delete entries found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { DeleteEntriesByModel } = await import(
                    /* webpackChunkName: "DeleteEntriesByModel" */ "~/tasks/entries/useCases/DeleteEntriesByModel"
                );

                const deleteEntriesByModel = new DeleteEntriesByModel();
                return await deleteEntriesByModel.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing DeleteEntriesByModel task"
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
                console.error("Error while cleaning `DeleteEntriesByModel` child tasks.", ex);
            }
        }
    });
};
