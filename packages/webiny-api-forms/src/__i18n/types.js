// @flow
export type I18NContext = {
    i18n: {
        defaultLocale: string,
        acceptLanguage: ?string,
        getLocale: () => string
    }
};
