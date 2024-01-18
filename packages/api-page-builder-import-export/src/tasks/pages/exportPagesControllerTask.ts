import { createPrivateTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import { IExportPagesControllerInput, PageExportTask } from "~/export/pages/types";

export const createExportPagesControllerTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IExportPagesControllerInput>({
        id: PageExportTask.Controller,
        title: "Page Builder - Export Pages",
        description: "Export pages from the Page Builder - controller.",
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { ExportPagesController } = await import("~/export/pages/ExportPagesController");

            try {
                const exportPagesController = new ExportPagesController();
                return await exportPagesController.execute(params);
            } catch (ex) {
                return response.error(ex);
            }
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
