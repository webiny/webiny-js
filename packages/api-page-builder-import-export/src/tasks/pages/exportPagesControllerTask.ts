import { createTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import {
    IExportPagesControllerInput,
    IExportPagesControllerOutput,
    PageExportTask
} from "~/export/pages/types";
import { ChildTasksCleanup } from "../common/ChildTasksCleanup";

export const createExportPagesControllerTask = () => {
    // TODO make the task private with createPrivateTaskDefinition
    return createTaskDefinition<
        PbImportExportContext,
        IExportPagesControllerInput,
        IExportPagesControllerOutput
    >({
        isPrivate: true,
        id: PageExportTask.Controller,
        title: "Page Builder - Export Pages - Controller",
        description: "Export pages from the Page Builder - controller.",
        /**
         * We want to have a lot of executions because we need to pool the subtasks all the time.
         */
        maxIterations: 500,
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { ExportPagesController } = await import(
                /* webpackChunkName: "ExportPagesController" */ "~/export/pages/ExportPagesController"
            );

            const exportPagesController = new ExportPagesController();
            return await exportPagesController.execute(params);
        },
        onDone: async ({ context, task }) => {
            await context.tasks.trigger({
                definition: PageExportTask.Cleanup,
                parent: task,
                // delay cleanup for 25hrs
                delay: 25 * 60 * 60
            });
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
                console.error("Error while cleaning child tasks.", ex);
            }
        },
        onError: async ({ context, task }) => {
            await context.tasks.trigger({
                definition: PageExportTask.Cleanup,
                parent: task
            });
        },
        onAbort: async ({ context, task }) => {
            await context.tasks.trigger({
                definition: PageExportTask.Cleanup,
                parent: task
            });
        }
    });
};
