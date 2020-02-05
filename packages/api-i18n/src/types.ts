import { Plugin } from "@webiny/api/types";

export type I18NLocale = {
    id: string;
    code: string;
    default: boolean;
};

export type GraphQLContext = {
    i18n: {
        defaultLocale?: string;
        acceptLanguage?: string;
        getLocale: () => I18NLocale;
        getDefaultLocale: () => I18NLocale;
        getLocales: () => I18NLocale[];
    };
};

export type GraphQLContextI18NGetLocales<T = GraphQLContext> = Plugin & {
    name: "graphql-context-i18n-get-locales";
    resolve(params: { context: T }): Promise<any[]>;
};
