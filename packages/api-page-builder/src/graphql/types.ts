import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { DbContext } from "@webiny/handler-db/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { ClientContext } from "@webiny/handler-client/types";
import { Category, Menu, Page, PageElement, Settings, System } from "~/types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";

// CRUD types.
export type SortOrder = "asc" | "desc";
export interface ListPagesParams {
    limit?: number;
    page?: number;
    where?: {
        category?: string;
        status?: string;
        tags?: { query: string[]; rule?: "any" | "all" };
        [key: string]: any;
    };
    exclude?: string[];
    search?: { query?: string };
    sort?: { publishedOn?: SortOrder; createdOn?: SortOrder; title?: SortOrder };
}

export interface ListMeta {
    page: number;
    limit: number;
    totalCount: number;
    totalPages?: number;
    from?: number;
    to?: number;
    nextPage?: number;
    previousPage?: number;
}

// Pages CRUD.
export interface Tag {
    key: string;
    value?: string;
}

export interface TagItem {
    tag: Tag;
    configuration?: {
        meta?: Record<string, any>;
        storage?: {
            folder?: string;
            name?: string;
        };
    };
}

export interface PathItem {
    path: string;
    configuration?: {
        meta?: Record<string, any>;
        storage?: {
            folder?: string;
            name?: string;
        };
    };
}

export interface RenderParams {
    tags?: TagItem[];
    paths?: PathItem[];
}
export interface FlushParams {
    tags?: TagItem[];
    paths?: PathItem[];
}

export interface ListLatestPagesOptions {
    auth?: boolean;
}

export interface PagesCrud {
    // dataLoaders: {
    // getPublishedById: DataLoader<{ id: string; preview?: boolean }, Page>;
    // getById: DataLoader<string, Page | null>;
    // };
    get<TPage extends Page = Page>(id: string): Promise<TPage>;
    listLatest<TPage extends Page = Page>(
        args: ListPagesParams,
        options?: ListLatestPagesOptions
    ): Promise<[TPage[], ListMeta]>;
    listPublished<TPage extends Page = Page>(args: ListPagesParams): Promise<[TPage[], ListMeta]>;
    listTags(args: { search: { query: string } }): Promise<string[]>;
    getPublishedById<TPage extends Page = Page>(args: {
        id: string;
        preview?: boolean;
    }): Promise<TPage>;
    getPublishedByPath<TPage extends Page = Page>(args: { path: string }): Promise<TPage>;
    listPageRevisions<TPage extends Page = Page>(id: string): Promise<TPage[]>;
    create<TPage extends Page = Page>(category: string): Promise<TPage>;
    createFrom<TPage extends Page = Page>(page: string): Promise<TPage>;
    update<TPage extends Page = Page>(id: string, data: Record<string, any>): Promise<TPage>;
    delete<TPage extends Page = Page>(id: string): Promise<[TPage, TPage]>;
    publish<TPage extends Page = Page>(id: string): Promise<TPage>;
    unpublish<TPage extends Page = Page>(id: string): Promise<TPage>;
    requestReview<TPage extends Page = Page>(id: string): Promise<TPage>;
    requestChanges<TPage extends Page = Page>(id: string): Promise<TPage>;
    prerendering: {
        render(args: RenderParams): Promise<void>;
        flush(args: FlushParams): Promise<void>;
    };
}

export interface PageElementsCrud {
    get(id: string): Promise<PageElement>;
    list(): Promise<PageElement[]>;
    create(data: Record<string, any>): Promise<PageElement>;
    update(id: string, data: Record<string, any>): Promise<PageElement>;
    delete(id: string): Promise<PageElement>;
}

export interface CategoriesCrud {
    get(slug: string, options?: { auth: boolean }): Promise<Category>;
    list(): Promise<Category[]>;
    create(data: Record<string, any>): Promise<Category>;
    update(slug: string, data: Record<string, any>): Promise<Category>;
    delete(slug: string): Promise<Category>;
}

export interface ListMenuParams {
    sort?: string[];
}

export interface MenusCrud {
    get(slug: string): Promise<Menu>;
    getPublic(slug: string): Promise<Menu>;
    list(params?: ListMenuParams): Promise<Menu[]>;
    create(data: Record<string, any>): Promise<Menu>;
    update(slug: string, data: Record<string, any>): Promise<Menu>;
    delete(slug: string): Promise<Menu>;
}

/**
 * The options passed into the crud methods
 */
export interface DefaultSettingsCrudOptions {
    tenant?: string | false;
    locale?: string | false;
}

export interface SettingsCrud {
    getCurrent: () => Promise<Settings>;
    get: (options?: DefaultSettingsCrudOptions) => Promise<Settings>;
    getDefault: (options?: Pick<DefaultSettingsCrudOptions, "tenant">) => Promise<Settings>;
    update: (
        data: Record<string, any>,
        options?: { auth?: boolean } & DefaultSettingsCrudOptions
    ) => Promise<Settings>;
    getSettingsCacheKey: (options?: DefaultSettingsCrudOptions) => string;
}

export interface SystemCrud {
    get: () => Promise<System>;
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<void>;
    install(args: { name: string; insertDemoData: boolean }): Promise<void>;
    upgrade(version: string, data?: Record<string, any>): Promise<boolean>;
}

export interface PbContext
    extends I18NContentContext,
        I18NContext,
        ClientContext,
        DbContext,
        SecurityContext,
        TenancyContext,
        PrerenderingServiceClientContext {
    pageBuilder: Record<string, any> & {
        pages: PagesCrud;
        pageElements: PageElementsCrud;
        categories: CategoriesCrud;
        menus: MenusCrud;
        settings: SettingsCrud;
        system: SystemCrud;
    };
}

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
