import { createPrivateTaskDefinition } from "@webiny/tasks";
import { PbImportExportContext } from "~/graphql/types";
import { IImportPagesInput } from "~/import/pages/types";

export const createImportPagesControllerTask = () => {
    return createPrivateTaskDefinition<PbImportExportContext, IImportPagesInput>({
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
