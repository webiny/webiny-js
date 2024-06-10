import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";
import { RestoreEntryFromTrash } from "~/tasks/entries/gateways";
import { ProcessTask } from "~/tasks/entries/useCases";

export const createRestoreEntriesFromTrashTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.RestoreEntriesFromTrash,
        title: "Headless CMS - Restore entries from trash bin",
        description: "Restore entries from trash bin.",
        maxIterations: 2,
        run: async params => {
            const { response } = params;

            try {
                const restoreGateway = new RestoreEntryFromTrash();
                const processTask = new ProcessTask(restoreGateway);
                return await processTask.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing RestoreEntriesFromTrash task"
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
                console.error("Error while cleaning `RestoreEntriesFromTrash` child tasks.", ex);
            }
        }
    });
};
