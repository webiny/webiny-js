import { createPrivateTaskDefinition } from "@webiny/tasks";
import { IExportPagesCleanupInput, PageExportTask } from "~/export/pages/types";
import { PbImportExportContext } from "~/graphql/types";

export const createExportPagesCleanupTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IExportPagesCleanupInput>({
        id: PageExportTask.Cleanup,
        title: "Page Builder - Export Pages Cleanup",
        description: "Export pages from the Page Builder - cleanup.",
        run: async param => {
            const { response, isAborted } = param;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { ExportPagesCleanup } = await import("~/export/pages/ExportPagesCleanup");

            try {
                const exportPagesCleanup = new ExportPagesCleanup();
                return await exportPagesCleanup.execute(param);
            } catch (ex) {
                return response.error(ex);
            }
        }
    });
};
