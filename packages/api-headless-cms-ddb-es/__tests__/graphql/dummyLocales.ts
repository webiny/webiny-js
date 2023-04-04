import { ContextPlugin } from "@webiny/api";
import { CmsContext } from "@webiny/api-headless-cms/types";

export const createDummyLocales = () => {
    return new ContextPlugin<CmsContext>(async context => {
        const { i18n, security } = context;

        await security.authenticate("");
        security.disableAuthorization();
        const [items] = await i18n.locales.listLocales({
            where: {}
        });
        if (items.length > 0) {
            security.enableAuthorization();
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
        security.enableAuthorization();
    });
};
