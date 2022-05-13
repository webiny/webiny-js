import { I18NContentContext } from "~/types";
import { ContextPlugin } from "@webiny/handler";

/**
 * DEPRECATION NOTICE!
 *
 * This package remains here purely for backwards compatibility with existing projects.
 * All i18n logic now lives in `api-i18n` package, and this old context just forwards the calls to that main package.
 *
 * It will be completely removed in v6.
 */
export default () => {
    return new ContextPlugin<I18NContentContext>(async context => {
        context.i18nContent = {
            getCurrentLocale: () => context.i18n.getContentLocale(),
            hasI18NContentPermission: () => context.i18n.hasI18NContentPermission(),
            checkI18NContentPermission: () => context.i18n.checkI18NContentPermission()
        };
    });
};
