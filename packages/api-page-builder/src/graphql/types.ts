import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { DbContext } from "@webiny/handler-db/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import DataLoader from "dataloader";

export type HandlerConfiguration = {
    prerendering: {
        handler: string;
    };
};

// Entities.
export type File = {
    id: string;
    src: string;
};

export type Settings = {
    installed: boolean;
    name: string;
    websiteUrl: string;
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

// TODO
export type PageElement = {
    name: string;
    type: "element" | "block";
    category: string;
    content: Record<string, any>; // // TODO: define types
    preview: Record<string, any>; // TODO: define types
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

export type Menu = {
    title: string;
    slug: string;
    description: string;
    items: Record<string, any>;
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

export type Category = {
    name: string;
    slug: string;
    url: string;
    layout: string;
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

type PageStatus = "published" | "unpublished" | "reviewRequested" | "changesRequested" | "draft";

export type Page = {
    id: string;
    title: string;
    path: string;
    category: string;
    publishedOn: string;
    version: number;
    settings?: {
        social?: {
            title: string;
            description: string;
            image: Record<string, any>; // TODO: define types
            meta: Array<{ property: string; content: string }>;
        };
        seo?: {
            title: string;
            description: string;
            meta: Array<{ name: string; content: string }>;
        };
        general?: {
            tags: string[];
            snippet: string;
            layout: string;
            image: Record<string, any>; // TODO: define types
        };
    };
    locked: boolean;
    status: PageStatus;
    home: boolean;
    error: boolean;
    notFound: boolean;
    createdOn: string;
    savedOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

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
export type Tag = { id?: string; class?: string };
export type RenderPagesArgs = { tags?: Tag[]; paths: string[] };

export type PagesCrud = {
    get(id: string): Promise<Page>;
    listLatest(args: ListPagesArgs): Promise<[Page[], ListMeta]>;
    listPublished(args: ListPagesArgs): Promise<[Page[], ListMeta]>;
    listTags(args: { search: { query: string } }): Promise<string[]>;
    getPublished(args: { id?: string; path?: string }): Promise<Page>;
    listPageRevisions(id: string): Promise<Page[]>;
    create(category: string): Promise<Page>;
    createFrom(page: string): Promise<Page>;
    update(id: string, data: Record<string, any>): Promise<Page>;
    delete(id: string): Promise<[Page, Page]>;
    publish(id: string): Promise<Page>;
    unpublish(id: string): Promise<Page>;
    requestReview(id: string): Promise<Page>;
    requestChanges(id: string): Promise<Page>;
    setAsHomepage(id: string): Promise<Page>;
    render(args: RenderPagesArgs): Promise<void>;
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
    get(slug: string): Promise<Category>;
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

export type SettingsCrud = {
    get: (options?: { auth: boolean }) => Promise<Settings>;
    update: (data: Record<string, any>, options?: { auth: boolean }) => Promise<Settings>;
    getSettingsCacheKey: () => string;
};

// PBContext types.

export type PbContext = Context<
    I18NContentContext,
    I18NContext,
    DbContext,
    ElasticSearchClientContext,
    SecurityContext,
    TenancyContext,
    {
        pageBuilder: Record<string, any> & {
            pages: PagesCrud;
            pageElements: PageElementsCrud;
            categories: CategoriesCrud;
            menus: MenusCrud;
            settings: SettingsCrud;
        };
    }
>;

// Permissions.
export type PbSecurityPermission<TName, TExtraProps = {}> = SecurityPermission<{
    name: TName;

    // Can user operate only on content he created?
    own?: boolean;

    // Determines which of the following actions are allowed:
    // "r" - read
    // "w" - write
    // "d" - delete
    rwd?: string;
}> &
    TExtraProps;

export type MenuSecurityPermission = PbSecurityPermission<"pb.menu">;
export type CategorySecurityPermission = PbSecurityPermission<"pb.category">;

export type PageSecurityPermission = PbSecurityPermission<
    "pb.page",
    {
        // Determines which of the following actions are allowed:
        // "r" - request review (for unpublished page)
        // "c" - request change (for unpublished page on which a review was requested)
        // "p" - publish
        // "u" - unpublish
        rcpu: string;
    }
>;

// Hook plugins.
export type HookCallbackFunction<TData> = (context: PbContext, data: TData) => void | Promise<void>;
export type HookPlugin<TType, TData, TExtraHooks = {}> = {
    type: TType;
    beforeCreate?: HookCallbackFunction<TData>;
    afterCreate?: HookCallbackFunction<TData>;
    beforeUpdate?: HookCallbackFunction<TData>;
    afterUpdate?: HookCallbackFunction<TData>;
    beforeDelete?: HookCallbackFunction<TData>;
    afterDelete?: HookCallbackFunction<TData>;
};

export type PageHookPlugin = HookPlugin<
    "pb-page-hook",
    Page,
    {
        beforePublish?: HookCallbackFunction<Page>;
        afterPublish?: HookCallbackFunction<Page>;
        beforeUnpublish?: HookCallbackFunction<Page>;
        afterUnpublish?: HookCallbackFunction<Page>;
    }
>;

export type MenuHookPlugin = HookPlugin<
    "pb-menu-hook",
    Menu,
    {
        beforePublish?: HookCallbackFunction<Page>;
        afterPublish?: HookCallbackFunction<Page>;
        beforeUnpublish?: HookCallbackFunction<Page>;
        afterUnpublish?: HookCallbackFunction<Page>;
    }
>;

export type SettingsHookPlugin = Plugin<{
    type: "pb-settings-hook";
    beforeUpdate?: HookCallbackFunction<Settings>;
    afterUpdate?: HookCallbackFunction<Settings>;
}>;

export type InstallHookPlugin = Plugin<{
    name: "pb-install-hook";
    beforeInstall: (context: PbContext) => void;
    afterInstall: (context: PbContext) => void;
}>;
