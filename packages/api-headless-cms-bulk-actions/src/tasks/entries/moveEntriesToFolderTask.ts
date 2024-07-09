import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsBulkActionsContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";
import { MoveEntryToFolder } from "~/tasks/entries/gateways";
import { ProcessTask } from "~/tasks/entries/useCases/ProcessTask";

export const createMoveEntriesToFolderTask = () => {
    return createPrivateTaskDefinition<
        HcmsBulkActionsContext,
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.MoveEntriesToFolder,
        title: "Headless CMS - Move entries to folder",
        description: "Move entries to folder.",
        maxIterations: 2,
        run: async params => {
            const { response, input, context } = params;

            try {
                if (!input?.data?.folderId) {
                    return response.error(`Missing "data.folderId" in the input.`);
                }

                const moveGateway = new MoveEntryToFolder(context);
                const processTask = new ProcessTask(moveGateway);
                return await processTask.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing MoveEntriesToFolder task"
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
                console.error("Error while cleaning `MoveEntriesToFolder` child tasks.", ex);
            }
        }
    });
};
