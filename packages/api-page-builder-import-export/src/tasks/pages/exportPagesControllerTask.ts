import { createTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import {
    IExportPagesControllerInput,
    IExportPagesControllerOutput,
    PageExportTask
} from "~/export/pages/types";

export const createExportPagesControllerTask = () => {
    // TODO make the task private with createPrivateTaskDefinition
    return createTaskDefinition<
        PbImportExportContext,
        IExportPagesControllerInput,
        IExportPagesControllerOutput
    >({
        id: PageExportTask.Controller,
        title: "Page Builder - Export Pages - Controller",
        description: "Export pages from the Page Builder - controller.",
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { ExportPagesController } = await import(
                /* webpackChunkName: "PageExportTaskController" */ "~/export/pages/ExportPagesController"
            );

            const exportPagesController = new ExportPagesController();
            return await exportPagesController.execute(params);
        },
        onDone: async ({ context, task }) => {
            await context.tasks.trigger({
                definition: PageExportTask.Cleanup,
                parent: task
                //delay: 24 * 60 * 60,
            });
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
