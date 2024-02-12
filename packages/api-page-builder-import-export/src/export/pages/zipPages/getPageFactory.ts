import { PbImportExportContext } from "~/graphql/types";
import { ITaskManagerStore } from "@webiny/tasks";
import { IExportPagesZipPagesInput } from "~/export/pages/types";

export const getPageFactory = (
    context: PbImportExportContext,
    store: ITaskManagerStore<IExportPagesZipPagesInput>,
    published: boolean
) => {
    return async (pageId: string) => {
        if (published) {
            try {
                return await context.pageBuilder.getPublishedPageById({
                    id: pageId
                });
            } catch (ex) {
                /**
                 * We do not need to do anything on exception because we will fetch the latest version.
                 */
            }
        }
        try {
            return await context.pageBuilder.getPage(pageId);
        } catch (ex) {
            const message = `There is no page with ID ${pageId}.`;
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
