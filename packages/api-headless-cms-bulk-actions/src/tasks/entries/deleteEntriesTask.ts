import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsBulkActionsContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";
import { DeleteEntry } from "~/tasks/entries/gateways";
import { ProcessTask } from "~/tasks/entries/useCases/ProcessTask";

export const createDeleteEntriesTask = () => {
    return createPrivateTaskDefinition<
        HcmsBulkActionsContext,
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.DeleteEntries,
        title: "Headless CMS - Delete entries",
        description: "Delete entries.",
        maxIterations: 2,
        run: async params => {
            const { response, context } = params;

            try {
                const deleteGateway = new DeleteEntry(context);
                const processTask = new ProcessTask(deleteGateway);
                return await processTask.execute(params);
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing DeleteEntries task");
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
                console.error("Error while cleaning `DeleteEntries` child tasks.", ex);
            }
        }
    });
};
