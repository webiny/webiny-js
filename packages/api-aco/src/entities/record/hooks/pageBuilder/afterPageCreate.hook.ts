import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { AcoContext } from "~/types";

export const afterPageCreateHook = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.pageBuilder.onPageAfterCreate.subscribe(async ({ page }) => {
            try {
                const {
                    pid,
                    title,
                    content,
                    createdBy,
                    createdOn,
                    savedOn,
                    version,
                    status,
                    category
                } = page;

                await context.aco.search.create({
                    originalId: pid,
                    type: "PbPage",
                    location: {
                        folderId: "ROOT"
                    },
                    title,
                    content: JSON.stringify(content),
                    data: {
                        createdBy,
                        createdOn,
                        savedOn,
                        version,
                        status,
                        category
                    }
                });
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while creating page links to ROOT folder.",
                    code: "AFTER_PAGE_CREATE_ACO_HOOK_ERROR"
                });
            }
        });
    });
};
