import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsBulkActionsContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";
import { ProcessTask } from "~/tasks/entries/useCases";
import { MoveEntryToTrash } from "~/tasks/entries/gateways";

export const createMoveEntriesToTrashTask = () => {
    return createPrivateTaskDefinition<
        HcmsBulkActionsContext,
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.MoveEntriesToTrash,
        title: "Headless CMS - Move entries to trash bin",
        description: "Move entries to trash bin.",
        maxIterations: 2,
        run: async params => {
            const { response, context } = params;

            try {
                const moveToTrashGateway = new MoveEntryToTrash(context);
                const processTask = new ProcessTask(moveToTrashGateway);
                return await processTask.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing MoveEntriesToTrash task"
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
                console.error("Error while cleaning `MoveEntriesToTrash` child tasks.", ex);
            }
        }
    });
};
