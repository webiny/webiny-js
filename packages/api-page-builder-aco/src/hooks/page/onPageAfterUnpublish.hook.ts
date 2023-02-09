import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context } from "~/types";

export const onPageAfterUnpublishHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder, aco }) => {
        try {
            pageBuilder.onPageAfterUnpublish.subscribe(async ({ page }) => {
                const { pid, status, savedOn } = page;

                const existing = await aco.search.get(pid);

                await aco.search.update(pid, {
                    data: {
                        ...existing.data,
                        status,
                        savedOn
                    }
                });
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterUnpublishHook hook",
                code: "ACO_AFTER_PAGE_UNPUBLISH_HOOK"
            });
        }
    });
};
