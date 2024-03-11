import { createPrivateTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import {
    IImportPagesProcessPagesInput,
    IImportPagesProcessPagesOutput,
    PageImportTask
} from "~/import/pages/types";

export const createImportPagesProcessPagesTask = () => {
    return createPrivateTaskDefinition<
        PbImportExportContext,
        IImportPagesProcessPagesInput,
        IImportPagesProcessPagesOutput
    >({
        id: PageImportTask.Process,
        title: "Page Builder - Import Pages Process",
        description: "Import pages from the Page Builder - Process pages.",
        /**
         * We do not want to have a large number of iterations because we are splitting page processing into multiple tasks.
         */
        maxIterations: 20,
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }
            const { ImportPagesProcessPages } = await import(
                /* webpackChunkName: "ImportPagesProcessPages" */ "~/import/pages/ImportPagesProcessPages"
            );

            const importPagesProcessPages = new ImportPagesProcessPages();

            return await importPagesProcessPages.execute(params);
        }
    });
};
