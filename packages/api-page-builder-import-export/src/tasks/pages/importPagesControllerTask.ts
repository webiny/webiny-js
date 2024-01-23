import { createPrivateTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import { IImportPagesInput } from "~/import/pages/types";

export const createImportPagesControllerTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IImportPagesInput>({
        id: "pageBuilderImportPages",
        title: "Page Builder - Import Pages",
        description: "Import pages from the Page Builder.",
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }
            const { importPages } = await import(
                /* webpackChunkName: "PageImportTaskController" */ "~/import/pages"
            );

            return await importPages(params);
        }
    });
};
