import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IEmptyTrashBinByModelInput,
    IEmptyTrashBinByModelOutput
} from "~/types";

export const createEmptyTrashBinByModelTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IEmptyTrashBinByModelInput,
        IEmptyTrashBinByModelOutput
    >({
        id: EntriesTask.EmptyTrashBinByModel,
        title: "Headless CMS - Empty trash bin by model",
        description: "Delete all entries found in the trash bin, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { EmptyTrashBinByModel } = await import(
                    /* webpackChunkName: "EmptyTrashBinByModel" */ "~/tasks/entries/useCases/EmptyTrashBinByModel"
                );

                const emptyTrashBinByModel = new EmptyTrashBinByModel();
                return await emptyTrashBinByModel.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing EmptyTrashBinByModel task"
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
                console.error("Error while cleaning `EmptyTrashBinByModel` child tasks.", ex);
            }
        }
    });
};
