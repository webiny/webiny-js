import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { CreateTasksByModel, ProcessTasksByModel } from "~/tasks/entries/useCases";
import { ListPublishedEntries } from "~/tasks/entries/gateways";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationByModelOutput
} from "~/types";

export const createUnpublishEntriesByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationByModelInput,
        IBulkActionOperationByModelOutput
    >({
        id: EntriesTask.UnpublishEntriesByModel,
        title: "Headless CMS - Unpublish entries by model",
        description: "Unpublish entries found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, input, context } = params;

            try {
                if (!input.modelId) {
                    return response.error(`Missing "modelId" in the input.`);
                }

                if (input.processing) {
                    const processTasks = new ProcessTasksByModel(EntriesTask.UnpublishEntries);
                    return await processTasks.execute(params);
                }

                const listGateway = new ListPublishedEntries(context);
                const createTasks = new CreateTasksByModel(
                    EntriesTask.UnpublishEntries,
                    listGateway
                );
                return await createTasks.execute(params);
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
