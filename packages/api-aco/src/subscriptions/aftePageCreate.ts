import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import get from "lodash.get";

import { ACOContext } from "~/types";

export const afterPageCreate = () => {
    return new ContextPlugin<ACOContext>(async context => {
        context.pageBuilder.onPageAfterCreate.subscribe(async ({ page, meta }) => {
            try {
                const folderId = get(meta, "location.folderId", "ROOT");
                await context.folders.createLink({ id: page.pid, folderId });
            } catch (error) {
                /**
                 * In case the link already exists for the current page, just return.
                 */
                if (error.code === "LINK_EXISTS") {
                    return;
                }

                throw WebinyError.from(error, {
                    message: "Error while creating page link.",
                    code: "AFTER_PAGE_CREATE"
                });
            }
        });
    });
};
