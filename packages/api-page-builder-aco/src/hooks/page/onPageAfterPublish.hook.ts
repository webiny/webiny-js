import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context } from "~/types";

export const onPageAfterPublishHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder, aco }) => {
        try {
            pageBuilder.onPageAfterPublish.subscribe(async ({ page }) => {
                const { pid, status, locked, savedOn, publishedOn } = page;

                const existing = await aco.search.get(pid);

                await aco.search.update(pid, {
                    data: {
                        ...existing.data,
                        status,
                        locked,
                        savedOn,
                        publishedOn
                    }
                });
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterPublishHook hook",
                code: "ACO_AFTER_PAGE_PUBLISH_HOOK"
            });
        }
    });
};
