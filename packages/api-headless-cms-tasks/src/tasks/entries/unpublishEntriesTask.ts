import { createPrivateTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IUnpublishEntriesInput,
    IUnpublishEntriesOutput
} from "~/types";

export const createUnpublishEntriesTask = () => {
    return createPrivateTaskDefinition<
        HcmsTasksContext,
        IUnpublishEntriesInput,
        IUnpublishEntriesOutput
    >({
        id: EntriesTask.UnpublishEntries,
        title: "Headless CMS - Unpublish entries",
        description: "Unpublish entries.",
        maxIterations: 2,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { UnpublishEntries } = await import(
                    /* webpackChunkName: "UnpublishEntries" */ "~/tasks/entries/useCases/UnpublishEntries"
                );

                const unpublishEntries = new UnpublishEntries();
                return await unpublishEntries.execute(params);
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
