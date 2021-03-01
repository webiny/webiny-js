import { Plugin } from "@webiny/plugins/types";
import { ClientContext } from "@webiny/handler-client/types";
import { ContextInterface } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

export type I18NLocale = {
    code: string;
    default: boolean;
};

export type I18NContextObject = {
    __i18n: {
        acceptLanguage: string;
        defaultLocale: I18NLocale;
        locale: Record<string, I18NLocale>;
        locales: I18NLocale[];
    };
    defaultLocale?: string;
    acceptLanguage?: string;
    getCurrentLocale: (localeContext?: string) => I18NLocale;
    getCurrentLocales: () => { context: string; locale: string }[];
    getDefaultLocale: () => I18NLocale;
    getLocales: () => I18NLocale[];
    getLocale: (code: string) => I18NLocale | null;
};

export interface I18NContext extends ContextInterface, ClientContext, TenancyContext {
    i18n: I18NContextObject;
}

export type ContextI18NGetLocales = Plugin & {
    name: "context-i18n-get-locales";
    resolve(params: { context: I18NContext }): Promise<any[]>;
};

export type I18NLocaleContextPlugin = Plugin<{
    name: "api-i18n-locale-context";
    context: {
        name: string;
    };
}>;
