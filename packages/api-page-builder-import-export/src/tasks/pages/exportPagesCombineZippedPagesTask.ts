import { createPrivateTaskDefinition } from "@webiny/tasks";
import { IExportPagesCombineZippedPagesInput, PageExportTask } from "~/export/pages/types";
import { PbImportExportContext } from "~/graphql/types";

export const createExportPagesCombineZippedPagesTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IExportPagesCombineZippedPagesInput>({
        id: PageExportTask.CombineZippedPages,
        title: "Page Builder - Combine Zipped Pages",
        description: "Export pages from the Page Builder - combine zipped pages.",
        run: async params => {
            const { response, isAborted } = params;
            /**
             * We always need to check task status.
             */
            if (isAborted()) {
                return response.aborted();
            }

            const { ExportPagesCombineZippedPages } = await import(
                "~/export/pages/ExportPagesCombineZippedPages"
            );

            const exportPagesCombineZippedPages = new ExportPagesCombineZippedPages();
            return await exportPagesCombineZippedPages.execute(params);
        }
    });
};
