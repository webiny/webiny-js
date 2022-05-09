import { DbContext } from "@webiny/handler-db/types";
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
    Menu,
    Page,
    PageElement,
    PageSettings,
    PageSpecialType,
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
    cursor: string | null;
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

/**
 * @category Lifecycle events
 */
export interface OnBeforePageCreateTopicParams<TPage extends Page = Page> {
    page: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageCreateTopicParams<TPage extends Page = Page> {
    page: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageUpdateTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageUpdateTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageCreateFromTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageCreateFromTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageDeleteTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
    publishedPage: TPage | null;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageDeleteTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage | null;
    publishedPage: TPage | null;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePagePublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
    publishedPage: TPage | null;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPagePublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
    publishedPage: TPage | null;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageUnpublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageUnpublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageRequestReviewTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageRequestReviewTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageRequestChangesTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageRequestChangesTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}

/**
 * @category Pages
 */
export interface PagesCrud {
    getPage<TPage extends Page = Page>(id: string, options?: GetPagesOptions): Promise<TPage>;
    listLatestPages<TPage extends Page = Page>(
        args: ListPagesParams,
        options?: ListLatestPagesOptions
    ): Promise<[TPage[], ListMeta]>;
    listPublishedPages<TPage extends Page = Page>(
        args: ListPagesParams
    ): Promise<[TPage[], ListMeta]>;
    listPagesTags(args: { search: { query: string } }): Promise<string[]>;
    getPublishedPageById<TPage extends Page = Page>(args: {
        id: string;
        preview?: boolean;
    }): Promise<TPage>;
    getPublishedPageByPath<TPage extends Page = Page>(args: { path: string }): Promise<TPage>;
    listPageRevisions<TPage extends Page = Page>(id: string): Promise<TPage[]>;
    createPage<TPage extends Page = Page>(category: string): Promise<TPage>;
    createPageFrom<TPage extends Page = Page>(page: string): Promise<TPage>;
    updatePage<TPage extends Page = Page>(id: string, data: PbUpdatePageInput): Promise<TPage>;
    deletePage<TPage extends Page = Page>(id: string): Promise<[TPage, TPage]>;
    publishPage<TPage extends Page = Page>(id: string): Promise<TPage>;
    unpublishPage<TPage extends Page = Page>(id: string): Promise<TPage>;
    requestPageReview<TPage extends Page = Page>(id: string): Promise<TPage>;
    requestPageChanges<TPage extends Page = Page>(id: string): Promise<TPage>;
    prerendering: {
        render(args: RenderParams): Promise<void>;
        flush(args: FlushParams): Promise<void>;
    };
    /**
     * Lifecycle events
     */
    onBeforePageCreate: Topic<OnBeforePageCreateTopicParams>;
    onAfterPageCreate: Topic<OnAfterPageCreateTopicParams>;
    onBeforePageCreateFrom: Topic<OnBeforePageCreateFromTopicParams>;
    onAfterPageCreateFrom: Topic<OnAfterPageCreateFromTopicParams>;
    onBeforePageUpdate: Topic<OnBeforePageUpdateTopicParams>;
    onAfterPageUpdate: Topic<OnAfterPageUpdateTopicParams>;
    onBeforePageDelete: Topic<OnBeforePageDeleteTopicParams>;
    onAfterPageDelete: Topic<OnAfterPageDeleteTopicParams>;
    onBeforePagePublish: Topic<OnBeforePagePublishTopicParams>;
    onAfterPagePublish: Topic<OnAfterPagePublishTopicParams>;
    onBeforePageUnpublish: Topic<OnBeforePageUnpublishTopicParams>;
    onAfterPageUnpublish: Topic<OnAfterPageUnpublishTopicParams>;
    onBeforePageRequestReview: Topic<OnBeforePageRequestReviewTopicParams>;
    onAfterPageRequestReview: Topic<OnAfterPageRequestReviewTopicParams>;
    onBeforePageRequestChanges: Topic<OnBeforePageRequestChangesTopicParams>;
    onAfterPageRequestChanges: Topic<OnAfterPageRequestChangesTopicParams>;
}

export interface ListPageElementsParams {
    sort?: string[];
}

/**
 * @category Lifecycle events
 */
export interface OnBeforePageElementCreateTopicParams {
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageElementCreateTopicParams {
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageElementUpdateTopicParams {
    original: PageElement;
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageElementUpdateTopicParams {
    original: PageElement;
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforePageElementDeleteTopicParams {
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterPageElementDeleteTopicParams {
    pageElement: PageElement;
}

/**
 * @category PageElements
 */
export interface PageElementsCrud {
    getPageElement(id: string): Promise<PageElement | null>;
    listPageElements(params?: ListPageElementsParams): Promise<PageElement[]>;
    createPageElement(data: Record<string, any>): Promise<PageElement>;
    updatePageElement(id: string, data: Record<string, any>): Promise<PageElement>;
    deletePageElement(id: string): Promise<PageElement>;
    /**
     * Lifecycle events
     */
    onBeforePageElementCreate: Topic<OnBeforePageElementCreateTopicParams>;
    onAfterPageElementCreate: Topic<OnAfterPageElementCreateTopicParams>;
    onBeforePageElementUpdate: Topic<OnBeforePageElementUpdateTopicParams>;
    onAfterPageElementUpdate: Topic<OnAfterPageElementUpdateTopicParams>;
    onBeforePageElementDelete: Topic<OnBeforePageElementDeleteTopicParams>;
    onAfterPageElementDelete: Topic<OnAfterPageElementDeleteTopicParams>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeCategoryCreateTopicParams {
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterCategoryCreateTopicParams {
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeCategoryUpdateTopicParams {
    original: Category;
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterCategoryUpdateTopicParams {
    original: Category;
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeCategoryDeleteTopicParams {
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterCategoryDeleteTopicParams {
    category: Category;
}

/**
 * @category Categories
 */
export interface CategoriesCrud {
    getCategory(slug: string, options?: { auth: boolean }): Promise<Category | null>;
    listCategories(): Promise<Category[]>;
    createCategory(data: PbCategoryInput): Promise<Category>;
    updateCategory(slug: string, data: PbCategoryInput): Promise<Category>;
    deleteCategory(slug: string): Promise<Category>;
    /**
     * Lifecycle events
     */
    onBeforeCategoryCreate: Topic<OnBeforeCategoryCreateTopicParams>;
    onAfterCategoryCreate: Topic<OnAfterCategoryCreateTopicParams>;
    onBeforeCategoryUpdate: Topic<OnBeforeCategoryUpdateTopicParams>;
    onAfterCategoryUpdate: Topic<OnAfterCategoryUpdateTopicParams>;
    onBeforeCategoryDelete: Topic<OnBeforeCategoryDeleteTopicParams>;
    onAfterCategoryDelete: Topic<OnAfterCategoryDeleteTopicParams>;
}

export interface MenuGetOptions {
    auth?: boolean;
}

export interface ListMenuParams {
    sort?: string[];
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeMenuCreateTopicParams {
    menu: Menu;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterMenuCreateTopicParams {
    menu: Menu;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeMenuUpdateTopicParams {
    original: Menu;
    menu: Menu;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterMenuUpdateTopicParams {
    original: Menu;
    menu: Menu;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeMenuDeleteTopicParams {
    menu: Menu;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterMenuDeleteTopicParams {
    menu: Menu;
}

/**
 * @category Menu
 */
export interface MenusCrud {
    getMenu(slug: string, options?: MenuGetOptions): Promise<Menu | null>;
    getPublicMenu(slug: string): Promise<Menu>;
    listMenus(params?: ListMenuParams): Promise<Menu[]>;
    createMenu(data: Record<string, any>): Promise<Menu>;
    updateMenu(slug: string, data: Record<string, any>): Promise<Menu>;
    deleteMenu(slug: string): Promise<Menu>;
    /**
     * Lifecycle events
     */
    onBeforeMenuCreate: Topic<OnBeforeMenuCreateTopicParams>;
    onAfterMenuCreate: Topic<OnAfterMenuCreateTopicParams>;
    onBeforeMenuUpdate: Topic<OnBeforeMenuUpdateTopicParams>;
    onAfterMenuUpdate: Topic<OnAfterMenuUpdateTopicParams>;
    onBeforeMenuDelete: Topic<OnBeforeMenuDeleteTopicParams>;
    onAfterMenuDelete: Topic<OnAfterMenuDeleteTopicParams>;
}

/**
 * The options passed into the crud methods
 */
export interface DefaultSettingsCrudOptions {
    tenant: string | false | undefined;
    locale: string | false;
}

export interface SettingsUpdateTopicMetaParams {
    diff: {
        pages: Array<[PageSpecialType, string, string, Page]>;
    };
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeSettingsUpdateTopicParams {
    original: Settings;
    settings: Settings;
    meta: SettingsUpdateTopicMetaParams;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterSettingsUpdateTopicParams {
    original: Settings;
    settings: Settings;
    meta: SettingsUpdateTopicMetaParams;
}

/**
 * @category Settings
 */
export interface SettingsCrud {
    getCurrentSettings: () => Promise<Settings>;
    getSettings: (options?: DefaultSettingsCrudOptions) => Promise<Settings | null>;
    getDefaultSettings: (
        options?: Pick<DefaultSettingsCrudOptions, "tenant">
    ) => Promise<Settings | null>;
    updateSettings: (
        data: Record<string, any>,
        options?: { auth?: boolean } & DefaultSettingsCrudOptions
    ) => Promise<Settings>;
    getSettingsCacheKey: (options?: DefaultSettingsCrudOptions) => string;
    /**
     * Lifecycle events
     */
    onBeforeSettingsUpdate: Topic<OnBeforeSettingsUpdateTopicParams>;
    onAfterSettingsUpdate: Topic<OnAfterSettingsUpdateTopicParams>;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeInstallTopicParams {
    tenant: string;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterInstallTopicParams {
    tenant: string;
}
/**
 * @category System
 */
export interface SystemCrud {
    getSystem: () => Promise<System | null>;
    getSystemVersion(): Promise<string | null>;
    setSystemVersion(version: string): Promise<void>;
    installSystem(args: { name: string; insertDemoData: boolean }): Promise<void>;
    upgradeSystem(version: string, data?: Record<string, any>): Promise<boolean>;
    /**
     * Lifecycle events
     */
    onBeforeInstall: Topic<OnBeforeInstallTopicParams>;
    onAfterInstall: Topic<OnBeforeInstallTopicParams>;
}

export interface PageBuilderContextObject
    extends PagesCrud,
        PageElementsCrud,
        CategoriesCrud,
        MenusCrud,
        SettingsCrud,
        SystemCrud {
    setPrerenderingHandlers: (configuration: PrerenderingHandlers) => void;
    getPrerenderingHandlers: () => PrerenderingHandlers;
    /**
     * Lifecycle events
     */
    onPageBeforeRender: Topic<PageBeforeRenderEvent>;
    onPageAfterRender: Topic<PageAfterRenderEvent>;
    onPageBeforeFlush: Topic<PageBeforeFlushEvent>;
    onPageAfterFlush: Topic<PageAfterFlushEvent>;
}

export interface PbContext
    extends I18NContext,
        ClientContext,
        DbContext,
        SecurityContext,
        TenancyContext,
        FileManagerContext,
        PrerenderingServiceClientContext {
    pageBuilder: PageBuilderContextObject;
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
        db?: {
            namespace: string;
        };
        meta?: Record<string, any>;
        storage?: {
            folder?: string;
            name?: string;
        };
    };
}

export interface RenderParams {
    queue?: boolean;
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

export interface PbCategoryInput {
    name: string;
    slug: string;
    url: string;
    layout: string;
}

interface PbPageVisibilitySettingsInput {
    published: boolean;
    latest: boolean;
}

interface PbPageVisibilityInput {
    get: PbPageVisibilitySettingsInput;
    list: PbPageVisibilitySettingsInput;
}

export interface PbUpdatePageInput {
    title?: string;
    category?: string;
    path?: string;
    visibility?: PbPageVisibilityInput;
    settings?: PageSettings;
    content?: Record<string, any> | null;
}
