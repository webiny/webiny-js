import { createPrivateTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import { IExportPagesControllerInput, PageExportTask } from "~/export/pages/types";

export const createExportPagesControllerTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IExportPagesControllerInput>({
        id: PageExportTask.Controller,
        title: "Page Builder - Export Pages",
        description: "Export pages from the Page Builder - controller.",
        run: async params => {
            const { response, isAborted, isCloseToTimeout, input } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { exportPagesController } = await import("~/export/pages/controller");

            try {
                return await exportPagesController(params);
            } catch (ex) {
                return response.error(ex);
            }
        }
    });
};
