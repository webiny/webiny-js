export const setContextLocale = (context, locale: string = null) => {
    context.cms.locale = context.i18n.getLocale();
    if (locale) {
        context.cms.locale = context.i18n.getLocales().find(l => l.code === locale);
    }
};
