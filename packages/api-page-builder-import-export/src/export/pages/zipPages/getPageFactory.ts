import { PbImportExportContext } from "~/graphql/types";
import { ITaskManagerStore } from "@webiny/tasks";
import { IExportPagesZipPagesInput } from "~/export/pages/types";

export const getPageFactory = (
    context: PbImportExportContext,
    store: ITaskManagerStore<IExportPagesZipPagesInput>
) => {
    return async (pageId: string, published?: boolean) => {
        try {
            if (published) {
                return await context.pageBuilder.getPublishedPageById({
                    id: pageId
                });
            }
            return await context.pageBuilder.getPage(pageId);
        } catch (ex) {
            const message = `There is no${published ? " published" : ""} page with ID ${pageId}.`;
            try {
                await store.addErrorLog({
                    message,
                    error: ex
                });
            } catch {
                console.error(`Failed to add error log: "${message}"`);
            }
            return null;
        }
    };
};
