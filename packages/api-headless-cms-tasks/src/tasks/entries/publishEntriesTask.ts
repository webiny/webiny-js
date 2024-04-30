import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationInput,
    IBulkActionOperationOutput
} from "~/types";

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
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { PublishEntries } = await import(
                    /* webpackChunkName: "PublishEntries" */ "~/tasks/entries/useCases/PublishEntries"
                );

                const publishEntries = new PublishEntries();
                return await publishEntries.execute(params);
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
