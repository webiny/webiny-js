import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import {
    EntriesTask,
    HcmsTasksContext,
    IPublishEntriesByModelInput,
    IPublishEntriesByModelOutput
} from "~/types";

export const createPublishEntriesByModelTask = () => {
    return createTaskDefinition<
        HcmsTasksContext,
        IPublishEntriesByModelInput,
        IPublishEntriesByModelOutput
    >({
        id: EntriesTask.PublishEntriesByModel,
        title: "Headless CMS - Publish entries by model",
        description: "Publish entries found for a particular query, by model.",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;

            try {
                if (isAborted()) {
                    return response.aborted();
                }

                const { PublishEntriesByModel } = await import(
                    /* webpackChunkName: "PublishEntriesByModel" */ "~/tasks/entries/useCases/PublishEntriesByModel"
                );

                const publishEntriesByModel = new PublishEntriesByModel();
                return await publishEntriesByModel.execute(params);
            } catch (ex) {
                return response.error(
                    ex.message ?? "Error while executing PublishEntriesByModel task"
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
                console.error("Error while cleaning `PublishEntriesByModel` child tasks.", ex);
            }
        }
    });
};
