import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { ClientContext } from "@webiny/handler-client/types";
import { Topic } from "@webiny/pubsub/types";
import { Args as PsFlushParams } from "@webiny/api-prerendering-service/flush/types";
import { Args as PsRenderParams } from "@webiny/api-prerendering-service/render/types";
import { Args as PsQueueAddParams } from "@webiny/api-prerendering-service/queue/add/types";

import {
    Category,
    CategoryStorageOperations,
    Menu,
    MenuStorageOperations,
    Page,
    PageElement,
    PageElementStorageOperations,
    PageStorageOperations,
    Settings,
    System
} from "~/types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";

// CRUD types.
export interface ListPagesParams {
    limit?: number;
    after?: string | null;
    where?: {
        category?: string;
        status?: string;
        tags?: { query: string[]; rule?: "any" | "all" };
        [key: string]: any;
    };
    exclude?: string[];
    search?: { query?: string };
    sort?: string[];
}

export interface ListMeta {
    /**
     * A cursor for pagination.
     */
    cursor: string;
    /**
     * Is there more items to load?
     */
    hasMoreItems: boolean;
    /**
     * Total count of the items in the storage.
     */
    totalCount: number;
}

// Pages CRUD.

export interface ListLatestPagesOptions {
    auth?: boolean;
}

export interface GetPagesOptions {
    decompress?: boolean;
}

export interface PagesCrud {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: PageStorageOperations;
    get<TPage extends Page = Page>(id: string, options?: GetPagesOptions): Promise<TPage>;
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

export interface ListPageElementsParams {
    sort?: string[];
}
export interface PageElementsCrud {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: PageElementStorageOperations;
    get(id: string): Promise<PageElement>;
    list(params?: ListPageElementsParams): Promise<PageElement[]>;
    create(data: Record<string, any>): Promise<PageElement>;
    update(id: string, data: Record<string, any>): Promise<PageElement>;
    delete(id: string): Promise<PageElement>;
}

export interface CategoriesCrud {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: CategoryStorageOperations;
    get(slug: string, options?: { auth: boolean }): Promise<Category>;
    list(): Promise<Category[]>;
    create(data: Record<string, any>): Promise<Category>;
    update(slug: string, data: Record<string, any>): Promise<Category>;
    delete(slug: string): Promise<Category>;
}

export interface MenuGetOptions {
    auth?: boolean;
}

export interface ListMenuParams {
    sort?: string[];
}

export interface MenusCrud {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: MenuStorageOperations;
    get(slug: string, options?: MenuGetOptions): Promise<Menu>;
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
        SecurityContext,
        TenancyContext,
        FileManagerContext,
        PrerenderingServiceClientContext {
    pageBuilder: Record<string, any> & {
        pages: PagesCrud;
        pageElements: PageElementsCrud;
        categories: CategoriesCrud;
        menus: MenusCrud;
        settings: SettingsCrud;
        system: SystemCrud;
        setPrerenderingHandlers: (configuration: PrerenderingHandlers) => void;
        getPrerenderingHandlers: () => PrerenderingHandlers;
        onPageBeforeRender: Topic<PageBeforeRenderEvent>;
        onPageAfterRender: Topic<PageAfterRenderEvent>;
        onPageBeforeFlush: Topic<PageBeforeFlushEvent>;
        onPageAfterFlush: Topic<PageAfterFlushEvent>;
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

// Page Builder lifecycle events.
export interface PageBeforeRenderEvent extends Pick<RenderParams, "paths" | "tags"> {
    args: {
        render?: PsRenderParams[];
        queue?: PsQueueAddParams[];
    };
}

export interface PageAfterRenderEvent extends Pick<RenderParams, "paths" | "tags"> {
    args: {
        render?: PsRenderParams[];
        queue?: PsQueueAddParams[];
    };
}

export interface PageBeforeFlushEvent extends Pick<FlushParams, "paths" | "tags"> {
    args: {
        flush?: PsFlushParams[];
        queue?: PsQueueAddParams[];
    };
}

export interface PageAfterFlushEvent extends Pick<FlushParams, "paths" | "tags"> {
    args: {
        flush?: PsFlushParams[];
        queue?: PsQueueAddParams[];
    };
}

// Prerendering configuration.
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
    context: PbContext;
    tags?: TagItem[];
    paths?: PathItem[];
}

export interface FlushParams {
    context: PbContext;
    tags?: TagItem[];
    paths?: PathItem[];
}

export interface PrerenderingHandlers {
    render(args: RenderParams): Promise<void>;
    flush(args: FlushParams): Promise<void>;
}
