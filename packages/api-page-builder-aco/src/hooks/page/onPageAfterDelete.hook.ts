import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context } from "~/types";

export const onPageAfterDeleteHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder, aco }) => {
        try {
            pageBuilder.onPageAfterDelete.subscribe(async ({ page }) => {
                await aco.search.delete(page.pid);
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterDeleteHook hook",
                code: "ACO_AFTER_PAGE_DELETE_HOOK"
            });
        }
    });
};
