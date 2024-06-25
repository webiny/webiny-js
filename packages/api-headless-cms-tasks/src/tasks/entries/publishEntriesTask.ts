import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";
import { PublishEntry } from "~/tasks/entries/gateways";
import { ProcessTask } from "~/tasks/entries/useCases";

export const createPublishEntriesTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IBulkActionOperationInput,
        IBulkActionOperationOutput
    >({
        id: EntriesTask.PublishEntries,
        title: "Headless CMS - Publish entries",
        description: "Publish entries.",
        maxIterations: 2,
        run: async params => {
            const { response, context } = params;

            try {
                const publishGateway = new PublishEntry(context);
                const processTask = new ProcessTask(publishGateway);
                return await processTask.execute(params);
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing PublishEntries task");
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
                console.error("Error while cleaning `PublishEntries` child tasks.", ex);
            }
        }
    });
};
