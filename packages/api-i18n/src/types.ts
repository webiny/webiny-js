import { Plugin } from "@webiny/graphql/types";
import { HandlerClientContext } from "@webiny/handler-client/types";

export type I18NLocale = {
    id: string;
    code: string;
    default: boolean;
};

export type HandlerI18NContextObject = {
    __i18n: {
        acceptLanguage: string;
        defaultLocale: I18NLocale;
        locale: Record<string, I18NLocale>;
        locales: I18NLocale[];
    };
    defaultLocale?: string;
    acceptLanguage?: string;
    getCurrentLocale: (localeContext?: string) => I18NLocale;
    getCurrentLocales: () => { context: string; locale: I18NLocale }[];
    getDefaultLocale: () => I18NLocale;
    getLocales: () => I18NLocale[];
};

export type HandlerI18NContext = {
    i18n: HandlerI18NContextObject;
};

export type ContextI18NGetLocales = Plugin & {
    name: "context-i18n-get-locales";
    resolve(params: { context: HandlerI18NContext & HandlerClientContext }): Promise<any[]>;
};

export type I18NLocaleContextPlugin = Plugin<{
    name: "api-i18n-locale-context";
    context: {
        name: string;
    };
}>;
