// @flow
import type { I18NContext } from "webiny-api-i18n/types";

export default async (_: Object, args: Object, context: I18NContext) => {
    const { i18n } = context;
    return {
        currentLocale: i18n.getLocale(),
        defaultLocale: i18n.getDefaultLocale(),
        locales: i18n.getLocales()
    };
};
