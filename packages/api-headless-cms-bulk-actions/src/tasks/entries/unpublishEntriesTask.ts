import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsBulkActionsContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";
import { UnpublishEntry } from "~/tasks/entries/gateways";
import { ProcessTask } from "~/tasks/entries/useCases";

export const createUnpublishEntriesTask = () => {
    return createPrivateTaskDefinition<
        HcmsBulkActionsContext,
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.UnpublishEntries,
        title: "Headless CMS - Unpublish entries",
        description: "Unpublish entries.",
        maxIterations: 2,
        run: async params => {
            const { response, context } = params;

            try {
                const unpublishGateway = new UnpublishEntry(context);
                const processTask = new ProcessTask(unpublishGateway);
                return await processTask.execute(params);
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing UnpublishEntries task");
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
                console.error("Error while cleaning `UnpublishEntries` child tasks.", ex);
            }
        }
    });
};
