import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { AcoContext } from "~/types";

export const afterPageUpdateHook = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.pageBuilder.onPageAfterUpdate.subscribe(async ({ page }) => {
            try {
                const { pid, title, content } = page;

                await context.aco.search.update(pid, {
                    title,
                    content: JSON.stringify(content)
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while creating page links to ROOT folder.",
                    code: "AFTER_PAGE_UPDATE_ACO_HOOK_ERROR"
                });
            }
        });
    });
};
