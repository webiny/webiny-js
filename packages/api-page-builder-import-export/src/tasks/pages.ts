import { createTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import { IExportPagesControllerInput, PageExportTask } from "~/export/pages/types";
import { IImportPagesInput } from "~/import/pages/types";

export const createExportPagesControllerTask = () => {
    return createTaskDefinition<PbImportExportContext, IExportPagesControllerInput>({
        id: PageExportTask.Controller,
        title: "Page Builder - Export Pages",
        description: "Export pages from the Page Builder - controller.",
        run: async params => {
            const { response, isAborted, isCloseToTimeout, input } = params;
            /**
             * We always need to check task status and if is close to timeout.
             */
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue(input);
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

export const createImportPagesTask = () => {
    return createTaskDefinition<PbImportExportContext, IImportPagesInput>({
        id: "pageBuilderImportPages",
        title: "Page Builder - Import Pages",
        description: "Import pages from the Page Builder.",
        run: async params => {
            const { response } = params;

            const { importPages } = await import("~/import/pages");

            try {
                return await importPages(params);
            } catch (ex) {
                return response.error(ex);
            }
        }
    });
};
