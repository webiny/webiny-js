import { Plugin } from "@webiny/graphql/types";

export type I18NLocale = {
    id: string;
    code: string;
    default: boolean;
};

export type Context = {
    i18n: {
        defaultLocale?: string;
        acceptLanguage?: string;
        getLocale: () => I18NLocale;
        getDefaultLocale: () => I18NLocale;
        getLocales: () => I18NLocale[];
    };
};

export type ContextI18NGetLocales<T = Context> = Plugin & {
    name: "context-i18n-get-locales";
    resolve(params: { context: T }): Promise<any[]>;
};
