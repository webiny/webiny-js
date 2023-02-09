import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context } from "~/types";

export const onPageAfterUnpublishHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder }) => {
        try {
            pageBuilder.onPageAfterUnpublish.subscribe(async ({ page, latestPage }) => {
                console.log("page", page);
                console.log("latestPage", latestPage);
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterUnpublishHook hook",
                code: "ACO_AFTER_PAGE_UNPUBLISH_HOOK"
            });
        }
    });
};
