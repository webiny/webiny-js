import { GraphQLContext, Plugin } from "@webiny/api/types";

export type I18NContext = {
    i18n: {
        defaultLocale: string;
        acceptLanguage?: string;
        getLocale: () => Promise<string>;
        getDefaultLocale: () => Promise<string>;
        getLocales: () => Promise<string[]>;
    };
};

export type GraphQLContextI18NGetLocales = Plugin & {
    name: "graphql-context-i18n-get-locales";
    resolve(params: { context: GraphQLContext }): Promise<any[]>;
};
