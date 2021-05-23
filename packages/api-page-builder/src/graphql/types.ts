import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { DbContext } from "@webiny/handler-db/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import DataLoader from "dataloader";
import { ClientContext } from "@webiny/handler-client/types";
import { Category, DefaultSettings, Menu, Page, PageElement, PageSpecialType } from "../types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";

// CRUD types.
export type SortOrder = "asc" | "desc";
export type ListPagesArgs = {
    limit?: number;
    page?: number;
    where?: {
        category?: string;
        status?: string;
        tags?: { query: string[]; rule?: "any" | "all" };
    };
    exclude?: string[];
    search?: { query?: string };
    sort?: { publishedOn?: SortOrder; createdOn?: SortOrder; title?: SortOrder };
};

export type ListMeta = {
    page: number;
    limit: number;
    totalCount: number;
    totalPages?: number;
    from?: number;
    to?: number;
    nextPage?: number;
    previousPage?: number;
};

// Pages CRUD.
export type Tag = { key: string; value?: string };

export type TagItem = {
    tag: Tag;
    configuration?: { meta?: Record<string, any>; storage?: { folder?: string; name?: string } };
};

export type PathItem = {
    path: string;
    configuration?: { meta?: Record<string, any>; storage?: { folder?: string; name?: string } };
};

export type RenderArgs = {
    tags?: TagItem[];
    paths?: PathItem[];
};
export type FlushArgs = {
    tags?: TagItem[];
    paths?: PathItem[];
};

export type PagesCrud = {
    dataLoaders: {
        getPublishedById: DataLoader<{ id: string; preview?: boolean }, Page>;
    };
    get(id: string): Promise<Page>;
    listLatest(args: ListPagesArgs): Promise<[Page[], ListMeta]>;
    listPublished(args: ListPagesArgs): Promise<[Page[], ListMeta]>;
    listTags(args: { search: { query: string } }): Promise<string[]>;
    getPublishedById(args: { id: string; preview?: boolean }): Promise<Page>;
    getPublishedByPath(args: { path: string }): Promise<Page>;
    listPageRevisions(id: string): Promise<Page[]>;
    create(category: string): Promise<Page>;
    createFrom(page: string): Promise<Page>;
    update(id: string, data: Record<string, any>): Promise<Page>;
    delete(id: string): Promise<[Page, Page]>;
    publish(id: string): Promise<Page>;
    unpublish(id: string): Promise<Page>;
    requestReview(id: string): Promise<Page>;
    requestChanges(id: string): Promise<Page>;
    prerendering: {
        render(args: RenderArgs): Promise<void>;
        flush(args: FlushArgs): Promise<void>;
    };
};

export type PageElementsCrud = {
    get(id: string): Promise<PageElement>;
    list(): Promise<PageElement[]>;
    create(data: Record<string, any>): Promise<PageElement>;
    update(id: string, data: Record<string, any>): Promise<PageElement>;
    delete(id: string): Promise<PageElement>;
};

export type CategoriesCrud = {
    dataLoaders: {
        get: DataLoader<string, Category>;
    };
    get(slug: string, options?: { auth: boolean }): Promise<Category>;
    list(): Promise<Category[]>;
    create(data: Record<string, any>): Promise<Category>;
    update(slug: string, data: Record<string, any>): Promise<Category>;
    delete(slug: string): Promise<Category>;
};

export type MenusCrud = {
    get(slug: string): Promise<Menu>;
    getPublic(slug: string): Promise<Menu>;
    list(): Promise<Menu[]>;
    create(data: Record<string, any>): Promise<Menu>;
    update(slug: string, data: Record<string, any>): Promise<Menu>;
    delete(slug: string): Promise<Menu>;
};

type DefaultSettingsCrudOptions = { tenant?: string | false; locale?: string | false };

export type SettingsCrud = {
    dataLoaders: {
        get: DataLoader<{ PK: string; SK: string }, DefaultSettings, string>;
    };
    default: {
        PK: (options: Record<string, any>) => string;
        SK: "default";
        get: (options?: DefaultSettingsCrudOptions) => Promise<DefaultSettings>;
        getDefault: (options?: { tenant?: string }) => Promise<DefaultSettings>;
        update: (
            data: Record<string, any>,
            options?: { auth?: boolean } & DefaultSettingsCrudOptions
        ) => Promise<DefaultSettings>;
        getSettingsCacheKey: (options?: DefaultSettingsCrudOptions) => string;
    };
};

export type SystemCrud = {
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<void>;
    install(args: { name: string; insertDemoData: boolean }): Promise<void>;
    upgrade(version: string, data?: Record<string, any>): Promise<boolean>;
};

// PBContext types.
export type PbContext = Context<
    I18NContentContext,
    I18NContext,
    ClientContext,
    DbContext,
    ElasticSearchClientContext,
    SecurityContext,
    TenancyContext,
    PrerenderingServiceClientContext,
    {
        pageBuilder: Record<string, any> & {
            pages: PagesCrud;
            pageElements: PageElementsCrud;
            categories: CategoriesCrud;
            menus: MenusCrud;
            settings: SettingsCrud;
            system: SystemCrud;
        };
    }
>;

// Permissions.
export interface PbSecurityPermission extends SecurityPermission {
    // Can user operate only on content he created?
    own?: boolean;

    // Determines which of the following actions are allowed:
    // "r" - read
    // "w" - write
    // "d" - delete
    rwd?: string;
}

export interface MenuSecurityPermission extends PbSecurityPermission {
    name: "pb.menu";
}

export interface CategorySecurityPermission extends PbSecurityPermission {
    name: "pb.category";
}

export interface PageSecurityPermission extends PbSecurityPermission {
    name: "pb.page";

    // Determines which of the following publishing workflow actions are allowed:
    // "r" - request review (for unpublished page)
    // "c" - request change (for unpublished page on which a review was requested)
    // "p" - publish
    // "u" - unpublish
    pw: string;
}

// Plugin types
export type CallbackFunction<T> = (args: T) => void | Promise<void>;

export interface PageUpdateInput {
    // TODO: add fields from GraphQL
    [key: string]: any;
}

export interface PageCreateParams {
    context: PbContext;
    page: Page;
}

export interface PageBeforeUpdateParams {
    context: PbContext;
    existingPage: Page;
    inputData: PageUpdateInput;
    updateData: Partial<Page>;
}

export interface PageAfterUpdateParams {
    context: PbContext;
    page: Page;
    inputData: PageUpdateInput;
}

export interface PageDeleteParams {
    context: PbContext;
    page: Page;
    // TODO: @doitadrian - we need to get rid of these two parameters below as they're very DDB specific
    latestPage: Page;
    publishedPage?: Page;
}

export interface PagePublishParams {
    context: PbContext;
    page: Page;
    // TODO: @doitadrian - we need to get rid of these two parameters below as they're very DDB specific
    latestPage: Page;
    publishedPage?: Page;
}

export interface PageUnpublishParams {
    context: PbContext;
    page: Page;
}

export interface PageNotFoundParams {
    context: PbContext;
    args: Record<string, any>;
}

export interface PbPagePlugin extends Plugin {
    type: "pb-page";
    beforeCreate?: CallbackFunction<PageCreateParams>;
    afterCreate?: CallbackFunction<PageCreateParams>;
    beforeUpdate?: CallbackFunction<PageBeforeUpdateParams>;
    afterUpdate?: CallbackFunction<PageAfterUpdateParams>;
    beforeDelete?: CallbackFunction<PageDeleteParams>;
    afterDelete?: CallbackFunction<PageDeleteParams>;
    beforePublish?: CallbackFunction<PagePublishParams>;
    afterPublish?: CallbackFunction<PagePublishParams>;
    beforeUnpublish?: CallbackFunction<PageUnpublishParams>;
    afterUnpublish?: CallbackFunction<PageUnpublishParams>;
    notFound?: (args: PageNotFoundParams) => Promise<Page | undefined>;
}

export interface MenuHookParams {
    context: PbContext;
    menu: Menu;
}

export type PbMenuPlugin = Plugin<{
    type: "pb-menu";
    beforeCreate?: CallbackFunction<MenuHookParams>;
    afterCreate?: CallbackFunction<MenuHookParams>;
    beforeUpdate?: CallbackFunction<MenuHookParams>;
    afterUpdate?: CallbackFunction<MenuHookParams>;
    beforeDelete?: CallbackFunction<MenuHookParams>;
    afterDelete?: CallbackFunction<MenuHookParams>;
}>;

type SettingsHookPluginPreviousSettings = DefaultSettings;
type SettingsHookPluginNextSettings = DefaultSettings;

export interface PbSettingsBeforeUpdateParams {
    context: PbContext;
    previousSettings: SettingsHookPluginPreviousSettings;
    nextSettings: SettingsHookPluginNextSettings;
    meta: {
        diff: {
            pages: Array<[PageSpecialType, string, string, Page]>;
        };
    };
}

export interface PbSettingsAfterUpdateParams {
    context: PbContext;
    previousSettings: SettingsHookPluginPreviousSettings;
    nextSettings: SettingsHookPluginNextSettings;
    meta: {
        diff: {
            pages: Array<[PageSpecialType, string, string, Page]>;
        };
    };
}

export type PbSettingsPlugin = Plugin<{
    type: "pb-settings";
    beforeUpdate?: CallbackFunction<PbSettingsBeforeUpdateParams>;
    afterUpdate?: CallbackFunction<PbSettingsAfterUpdateParams>;
}>;

export interface PbInstallBeforeInstallParams {
    context: PbContext;
}

export interface PbInstallAfterInstallParams {
    context: PbContext;
}

export type PbInstallPlugin = Plugin<{
    type: "pb-install";
    beforeInstall: CallbackFunction<PbInstallBeforeInstallParams>;
    afterInstall: CallbackFunction<PbInstallAfterInstallParams>;
}>;
