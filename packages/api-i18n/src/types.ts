export type I18NContext = Object & {
    i18n: {
        defaultLocale: string;
        acceptLanguage?: string;
        getLocale: () => Promise<string>;
        getDefaultLocale: () => Promise<string>;
        getLocales: () => Promise<string[]>;
    };
};
