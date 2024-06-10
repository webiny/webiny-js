import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { TaskCreate, TaskProcess } from "~/tasks/entries/domain";
import { ListDeletedEntries } from "~/tasks/entries/gateways";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
} from "~/types";

export const createDeleteEntriesByModelTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    >({
        id: EntriesTask.DeleteEntriesByModel,
        title: "Headless CMS - Delete entries by model",
        description: "Delete entries found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted, input } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                if (!input.modelId) {
                    return response.error(`Missing "modelId" in the input.`);
                }

                if (input.processing) {
                    const processTasks = new TaskProcess(EntriesTask.DeleteEntries);
                    return await processTasks.execute(params);
                }

                const listGateway = new ListDeletedEntries();
                const createTasks = new TaskCreate(EntriesTask.DeleteEntries, listGateway);
                return await createTasks.execute(params);
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
