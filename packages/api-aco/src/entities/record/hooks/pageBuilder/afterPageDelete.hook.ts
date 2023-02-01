import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { AcoContext } from "~/types";

export const afterPageDeleteHook = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.pageBuilder.onPageAfterDelete.subscribe(async ({ page }) => {
            try {
                const { pid } = page;
                await context.aco.search.delete(pid);
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while deleting page links to ROOT folder.",
                    code: "AFTER_PAGE_DELETE_ACO_HOOK_ERROR"
                });
            }
        });
    });
};
