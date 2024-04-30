import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
} from "~/types";

export const createRestoreEntriesFromTrashByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    >({
        id: EntriesTask.RestoreEntriesFromTrashByModel,
        title: "Headless CMS - Restore entries from trash bin by model",
        description: "Restore entries from trash bin found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { RestoreEntriesFromTrashByModel } = await import(
                    /* webpackChunkName: "RestoreEntriesFromTrashByModel" */ "~/tasks/entries/useCases/RestoreEntriesFromTrashByModel"
                );

                const restoreEntriesFromTrashByModel = new RestoreEntriesFromTrashByModel();
                return await restoreEntriesFromTrashByModel.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing RestoreEntriesFromTrashByModel task"
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
                console.error(
                    "Error while cleaning `RestoreEntriesFromTrashByModel` child tasks.",
                    ex
                );
            }
        }
    });
};
