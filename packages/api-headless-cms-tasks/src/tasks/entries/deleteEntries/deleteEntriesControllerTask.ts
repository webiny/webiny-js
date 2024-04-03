import { createTaskDefinition } from "@webiny/tasks";
import {
    DeleteEntriesTask,
    HeadlessCmsTasksContext,
    IDeleteEntriesControllerInput,
    IDeleteEntriesControllerOutput
} from "~/types";

export const createDeleteEntriesControllerTask = () => {
    return createTaskDefinition<
        HeadlessCmsTasksContext,
        IDeleteEntriesControllerInput,
        IDeleteEntriesControllerOutput
    >({
        id: DeleteEntriesTask.Controller,
        title: "Headless CMS - Delete Entries - Controller",
        description: "Delete entries task controller - Manages the entries to delete",
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { DeleteEntriesController } = await import(
                /* webpackChunkName: "DeleteEntriesController" */ "~/tasks/entries/deleteEntries/controller/DeleteEntriesController"
            );

            const deleteEntriesController = new DeleteEntriesController();
            return await deleteEntriesController.execute(params);
        }
    });
};
