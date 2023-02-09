import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context } from "~/types";

export const onPageAfterPublishHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder }) => {
        try {
            pageBuilder.onPageAfterPublish.subscribe(
                async ({ page, publishedPage, latestPage }) => {
                    console.log("page", page);
                    console.log("publishedPage", publishedPage);
                    console.log("latestPage", latestPage);
                }
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterPublishHook hook",
                code: "ACO_AFTER_PAGE_PUBLISH_HOOK"
            });
        }
    });
};
