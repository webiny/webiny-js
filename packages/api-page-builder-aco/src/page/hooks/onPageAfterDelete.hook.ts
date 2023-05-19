import WebinyError from "@webiny/error";

import { PbAcoContext } from "~/types";

export const onPageAfterDeleteHook = ({ pageBuilder, aco }: PbAcoContext) => {
    /**
     * Intercept page deletion and delete the related search record.
     */
    pageBuilder.onPageAfterDelete.subscribe(async ({ page }) => {
        try {
            await aco.search.delete(page.pid);
        } catch (error) {
            if (error.code === "NOT_FOUND") {
                return;
            }

            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterDeleteHook hook",
                code: "ACO_AFTER_PAGE_DELETE_HOOK"
            });
        }
    });
};
