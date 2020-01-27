import { I18NContext } from "../../../types";

export default async (_: {[key: string]: any}, args: {[key: string]: any}, context: I18NContext) => {
    const { i18n } = context;
    return {
        currentLocale: i18n.getLocale(),
        defaultLocale: i18n.getDefaultLocale(),
        locales: i18n.getLocales()
    };
};
