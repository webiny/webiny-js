import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/types";

export const createInitialPageCategoryForNewLocale = new ContextPlugin<PbContext>(context => {
    context.i18n.locales.onLocaleAfterCreate.subscribe(async ({ locale }) => {
        try {
            await context.pageBuilder.createCategory({
                name: "Static",
                slug: "static",
                url: "/static/",
                layout: "static",
                locale: locale.code
            });
        } catch {}
    });
});
