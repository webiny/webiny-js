import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { DbContext } from "@webiny/handler-db/types";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";

export type PbInstallPlugin = Plugin & {
    name: "pb-install";
    before: (params: { context: Context; data: any }) => void;
    after: (params: { context: Context; data: any }) => void;
};

export type PagesCrud = {};
export type PageElementsCrud = {};
export type CategoriesCrud = {};
export type MenusCrud = {};

export type File = {
    id: string;
    src: string;
};

export type Settings = {
    name: string;
    domain: string;
    favicon: File;
    logo: File;
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        image: File;
    };
    pages: {
        home: string;
        notFound: string;
        error: string;
    };
};

export type SettingsCrud = {
    get: () => Promise<Settings>;
    update: (data: Record<string, any>) => Promise<Settings>;
    getSettingsCacheKey: () => string;
};

export type PbContext = Context<
    I18NContentContext,
    I18NContext,
    DbContext,
    SecurityContext,
    TenancyContext,
    {
        pageBuilder: Record<string, any> & {
            pages: PagesCrud;
            pageElements: PagesCrud;
            categories: PagesCrud;
            menus: PagesCrud;
            settings: SettingsCrud;
        };
    }
>;
