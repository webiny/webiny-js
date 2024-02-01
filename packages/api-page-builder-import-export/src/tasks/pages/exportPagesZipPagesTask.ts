import { createPrivateTaskDefinition } from "@webiny/tasks";
import {
    IExportPagesZipPagesInput,
    IExportPagesZipPagesOutput,
    PageExportTask
} from "~/export/pages/types";
import { PbImportExportContext } from "~/graphql/types";

export const createExportPagesZipPagesTask = () => {
    return createPrivateTaskDefinition<
        PbImportExportContext,
        IExportPagesZipPagesInput,
        IExportPagesZipPagesOutput
    >({
        id: PageExportTask.ZipPages,
        title: "Page Builder - Export Pages - Zip Pages",
        description: "Export pages from the Page Builder - zip pages.",
        /**
         * If we ever hit the max iterations limit, we should decrease the number of pages being zipped in one task execution.
         */
        maxIterations: 10,
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { ExportPagesZipPages } = await import(
                /* webpackChunkName: "ExportPagesZipPages" */ "~/export/pages/ExportPagesZipPages"
            );

            const exportPagesZipPages = new ExportPagesZipPages();
            return await exportPagesZipPages.execute(params);
        }
    });
};
