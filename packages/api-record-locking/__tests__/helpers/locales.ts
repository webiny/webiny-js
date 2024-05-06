import { ContextPlugin } from "@webiny/api";
import { Context } from "~/types";

export const createDummyLocales = () => {
    return new ContextPlugin<Context>(async context => {
        const { i18n, security } = context;

        await security.authenticate("");

        await security.withoutAuthorization(async () => {
            const [items] = await i18n.locales.listLocales({
                where: {}
            });
            if (items.length > 0) {
                return;
            }
            await i18n.locales.createLocale({
                code: "en-US",
                default: true
            });
            await i18n.locales.createLocale({
                code: "de-DE",
                default: true
            });
        });
    });
};
