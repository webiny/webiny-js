import WebinyError from "@webiny/error";
import { CmsAcoContext } from "~/types";

export const attachOnEntryAfterDelete = (
    context: Pick<CmsAcoContext, "cms" | "plugins" | "aco">
): void => {
    context.cms.onEntryAfterDelete.subscribe(async ({ entry }) => {
        try {
            await context.aco.search.delete(entry.entryId);
        } catch (error) {
            if (error.code === "NOT_FOUND") {
                return;
            }

            throw WebinyError.from(error, {
                message: `Error while executing "onEntryAfterDeleteHook".`,
                code: "ACO_AFTER_ENTRY_DELETE_HOOK"
            });
        }
    });
};
