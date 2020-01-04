export type I18NContext = {
    i18n: {
        defaultLocale: string;
        acceptLanguage?: string;
        getLocale: () => Promise<string>;
        getDefaultLocale: () => Promise<string>;
        getLocales: () => Promise<string[]>;
    };
};
