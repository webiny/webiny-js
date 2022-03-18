import { Plugin } from "@webiny/app/types";
import { SecurityPermission } from "@webiny/app-security/types";

export type I18NLocaleContextPlugin = Plugin<{
    name: "api-i18n-locale-context";
    context: {
        name: string;
    };
}>;

export interface I18NCurrentLocaleItem {
    context: string;
    locale: string;
}
export interface I18NLocaleItem {
    code: string;
    default: boolean;
    createdOn?: string;
}

export interface GetI18NInformationResponse {
    i18n: {
        getI18NInformation: {
            currentLocales: I18NCurrentLocaleItem[];
            locales: I18NLocaleItem[];
            defaultLocale: {
                default: boolean;
                code: string;
            };
        };
    };
}

export interface I18NSecurityPermission extends SecurityPermission {
    level?: string;
    locales?: string[];
}
