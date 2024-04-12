import { createPrivateTaskDefinition } from "@webiny/tasks";
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
        }
    });
};
