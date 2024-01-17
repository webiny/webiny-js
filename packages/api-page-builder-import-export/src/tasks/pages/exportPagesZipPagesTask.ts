import { createPrivateTaskDefinition } from "@webiny/tasks";
import { IExportPagesZipPagesInput, PageExportTask } from "~/export/pages/types";
import { PbImportExportContext } from "~/graphql/types";

export const createExportPagesZipPagesTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IExportPagesZipPagesInput>({
        id: PageExportTask.ZipPages,
        title: "Page Builder - Zip Pages",
        description: "Export pages from the Page Builder - zip pages.",
        run: async params => {
            const { response, isAborted, isCloseToTimeout, input } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { exportPagesZipPages } = await import("~/export/pages/zipPages");

            try {
                return await exportPagesZipPages(params);
            } catch (ex) {
                return response.error(ex);
            }
        }
    });
};
