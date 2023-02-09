import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { Context } from "~/types";

export const onPageAfterUpdateHook = () => {
    return new ContextPlugin<Context>(async ({ pageBuilder, aco }) => {
        try {
            pageBuilder.onPageAfterUpdate.subscribe(async ({ page }) => {
                const {
                    id,
                    pid,
                    title,
                    content,
                    createdOn,
                    createdBy,
                    savedOn,
                    status,
                    version,
                    locked
                } = page;

                await aco.search.update(pid, {
                    title: title,
                    content: content?.content,
                    data: {
                        id,
                        createdBy,
                        createdOn,
                        savedOn,
                        status,
                        version,
                        locked
                    }
                });
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onPageAfterUpdateHook hook",
                code: "ACO_AFTER_PAGE_UPDATE_HOOK"
            });
        }
    });
};