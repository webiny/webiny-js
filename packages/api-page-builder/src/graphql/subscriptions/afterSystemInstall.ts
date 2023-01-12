import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { PbContext } from "~/types";

export const afterSystemInstall = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onSystemAfterInstall.subscribe(async () => {
            try {
                const [data] = await context.pageBuilder.listLatestPages({ limit: 100 });
                const pageIds = data.map(page => page.pid);

                await Promise.all(
                    pageIds.map(async id => {
                        try {
                            await context.folders.createLink({ id, folderId: "ROOT" });
                        } catch (e) {
                            /**
                             * In case the link already exists for the current page, just return and continue the process.
                             */
                            if (e.code === "LINK_EXISTS") {
                                return;
                            }
                            throw e;
                        }
                    })
                );
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while creating page links to ROOT folder.",
                    code: "AFTER_PAGE_BUILDER_SYSTEM_INSTALL"
                });
            }
        });
    });
};
