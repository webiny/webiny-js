import { DbContext } from "@webiny/handler-db/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { Topic } from "@webiny/pubsub/types";
import { FlushEvent, QueueAddJob, RenderEvent } from "@webiny/api-prerendering-service/types";
import { Context as BaseContext } from "@webiny/handler/types";

import {
    BlockCategory,
    Category,
    DefaultSettings,
    Menu,
    Page,
    PageBlock,
    PageElement,
    PageSettings,
    PageSpecialType,
    PageTemplate,
    PageTemplateInput,
    Settings,
    System
} from "~/types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";

// CRUD types.
export interface ListPagesParamsWhere {
    pid_in?: string[];
    category?: string;
    status?: string;
    tags?: { query: string[]; rule?: "any" | "all" };
    [key: string]: any;
}
export interface ListPagesParams {
    limit?: number;
    after?: string | null;
    where?: ListPagesParamsWhere;
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
export interface OnPageBeforeCreateTopicParams<TPage extends Page = Page> {
    page: TPage;
    meta?: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnPageAfterCreateTopicParams<TPage extends Page = Page> {
    page: TPage;
    meta?: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnPageBeforeUpdateTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnPageAfterUpdateTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnPageBeforeCreateFromTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnPageAfterCreateFromTopicParams<TPage extends Page = Page> {
    original: TPage;
    page: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnPageBeforeDeleteTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
    publishedPage: TPage | null;
    deleteMethod: "deleteAll" | "delete";
}
/**
 * @category Lifecycle events
 */
export interface OnPageAfterDeleteTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage | null;
    publishedPage: TPage | null;
    deleteMethod: "deleteAll" | "delete";
}
/**
 * @category Lifecycle events
 */
export interface OnPageBeforePublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
    publishedPage: TPage | null;
}
/**
 * @category Lifecycle events
 */
export interface OnPageAfterPublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
    publishedPage: TPage | null;
}
/**
 * @category Lifecycle events
 */
export interface OnPageBeforeUnpublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}
/**
 * @category Lifecycle events
 */
export interface OnPageAfterUnpublishTopicParams<TPage extends Page = Page> {
    page: TPage;
    latestPage: TPage;
}

export interface PbPageElement {
    id: string;
    type: string;
    data: any; // TODO: somehow type `data`
    elements: PbPageElement[];
}

export interface PbBlockVariable<TValue = any> {
    id: string;
    type: string;
    label: string;
    value: TValue;
}

interface PageElementProcessorParams {
    page: Page;
    block: PbPageElement;
    element: PbPageElement;
}

/**
 * Element processors modify elements by reference, without creating a new object.
 */
export interface PageElementProcessor {
    (params: PageElementProcessorParams): Promise<void> | void;
}

/**
 * @category Pages
 */
export interface PagesCrud {
    addPageElementProcessor(processor: PageElementProcessor): void;
    processPageContent(content: Page): Promise<Page>;
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
    createPage<TPage extends Page = Page>(
        category: string,
        meta?: Record<string, any>
    ): Promise<TPage>;
    createPageFrom<TPage extends Page = Page>(
        page: string,
        meta?: Record<string, any>
    ): Promise<TPage>;
    unlinkPageFromTemplate<TPage extends Page = Page>(id: string): Promise<TPage>;
    updatePage<TPage extends Page = Page>(id: string, data: PbUpdatePageInput): Promise<TPage>;
    deletePage<TPage extends Page = Page>(id: string): Promise<[TPage, TPage]>;
    publishPage<TPage extends Page = Page>(id: string): Promise<TPage>;
    unpublishPage<TPage extends Page = Page>(id: string): Promise<TPage>;
    prerendering: {
        render(args: RenderParams): Promise<void>;
        flush(args: FlushParams): Promise<void>;
    };
    /**
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    onBeforePageCreate: Topic<OnPageBeforeCreateTopicParams>;
    /**
     * @deprecated
     */
    onAfterPageCreate: Topic<OnPageAfterCreateTopicParams>;
    /**
     * @deprecated
     */
    onBeforePageCreateFrom: Topic<OnPageBeforeCreateFromTopicParams>;
    /**
     * @deprecated
     */
    onAfterPageCreateFrom: Topic<OnPageAfterCreateFromTopicParams>;
    /**
     * @deprecated
     */
    onBeforePageUpdate: Topic<OnPageBeforeUpdateTopicParams>;
    /**
     * @deprecated
     */
    onAfterPageUpdate: Topic<OnPageAfterUpdateTopicParams>;
    /**
     * @deprecated
     */
    onBeforePageDelete: Topic<OnPageBeforeDeleteTopicParams>;
    /**
     * @deprecated
     */
    onAfterPageDelete: Topic<OnPageAfterDeleteTopicParams>;
    /**
     * @deprecated
     */
    onBeforePagePublish: Topic<OnPageBeforePublishTopicParams>;
    /**
     * @deprecated
     */
    onAfterPagePublish: Topic<OnPageAfterPublishTopicParams>;
    /**
     * @deprecated
     */
    onBeforePageUnpublish: Topic<OnPageBeforeUnpublishTopicParams>;
    /**
     * @deprecated
     */
    onAfterPageUnpublish: Topic<OnPageAfterUnpublishTopicParams>;
    /**
     * Lifecycle events introduced in 5.34.0
     */
    onPageBeforeCreate: Topic<OnPageBeforeCreateTopicParams>;
    onPageAfterCreate: Topic<OnPageAfterCreateTopicParams>;
    onPageBeforeCreateFrom: Topic<OnPageBeforeCreateFromTopicParams>;
    onPageAfterCreateFrom: Topic<OnPageAfterCreateFromTopicParams>;
    onPageBeforeUpdate: Topic<OnPageBeforeUpdateTopicParams>;
    onPageAfterUpdate: Topic<OnPageAfterUpdateTopicParams>;
    onPageBeforeDelete: Topic<OnPageBeforeDeleteTopicParams>;
    onPageAfterDelete: Topic<OnPageAfterDeleteTopicParams>;
    onPageBeforePublish: Topic<OnPageBeforePublishTopicParams>;
    onPageAfterPublish: Topic<OnPageAfterPublishTopicParams>;
    onPageBeforeUnpublish: Topic<OnPageBeforeUnpublishTopicParams>;
    onPageAfterUnpublish: Topic<OnPageAfterUnpublishTopicParams>;
}

export interface ListPageElementsParams {
    sort?: string[];
}

/**
 * @category Lifecycle events
 */
export interface OnPageElementBeforeCreateTopicParams {
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnPageElementAfterCreateTopicParams {
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnPageElementBeforeUpdateTopicParams {
    original: PageElement;
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnPageElementAfterUpdateTopicParams {
    original: PageElement;
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnPageElementBeforeDeleteTopicParams {
    pageElement: PageElement;
}
/**
 * @category Lifecycle events
 */
export interface OnPageElementAfterDeleteTopicParams {
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
    deletePageElement(id: string): Promise<void>;
    /**
     * Lifecycle events
     */
    onPageElementBeforeCreate: Topic<OnPageElementBeforeCreateTopicParams>;
    onPageElementAfterCreate: Topic<OnPageElementAfterCreateTopicParams>;
    onPageElementBeforeUpdate: Topic<OnPageElementBeforeUpdateTopicParams>;
    onPageElementAfterUpdate: Topic<OnPageElementAfterUpdateTopicParams>;
    onPageElementBeforeDelete: Topic<OnPageElementBeforeDeleteTopicParams>;
    onPageElementAfterDelete: Topic<OnPageElementAfterDeleteTopicParams>;
}

/**
 * @category Lifecycle events
 */
export interface OnCategoryBeforeCreateTopicParams {
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnCategoryAfterCreateTopicParams {
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnCategoryBeforeUpdateTopicParams {
    original: Category;
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnCategoryAfterUpdateTopicParams {
    original: Category;
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnCategoryBeforeDeleteTopicParams {
    category: Category;
}
/**
 * @category Lifecycle events
 */
export interface OnCategoryAfterDeleteTopicParams {
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
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    /**
     * @deprecated
     */
    onBeforeCategoryCreate: Topic<OnCategoryBeforeCreateTopicParams>;
    /**
     * @deprecated
     */
    onAfterCategoryCreate: Topic<OnCategoryAfterCreateTopicParams>;
    /**
     * @deprecated
     */
    onBeforeCategoryUpdate: Topic<OnCategoryBeforeUpdateTopicParams>;
    /**
     * @deprecated
     */
    onAfterCategoryUpdate: Topic<OnCategoryAfterUpdateTopicParams>;
    /**
     * @deprecated
     */
    onBeforeCategoryDelete: Topic<OnCategoryBeforeDeleteTopicParams>;
    /**
     * @deprecated
     */
    onAfterCategoryDelete: Topic<OnCategoryAfterDeleteTopicParams>;
    /**
     * Introduced in 5.34.0
     */
    onCategoryBeforeCreate: Topic<OnCategoryBeforeCreateTopicParams>;
    onCategoryAfterCreate: Topic<OnCategoryAfterCreateTopicParams>;
    onCategoryBeforeUpdate: Topic<OnCategoryBeforeUpdateTopicParams>;
    onCategoryAfterUpdate: Topic<OnCategoryAfterUpdateTopicParams>;
    onCategoryBeforeDelete: Topic<OnCategoryBeforeDeleteTopicParams>;
    onCategoryAfterDelete: Topic<OnCategoryAfterDeleteTopicParams>;
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
export interface OnMenuBeforeCreateTopicParams {
    menu: Menu;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnMenuAfterCreateTopicParams {
    menu: Menu;
    input: Record<string, any>;
}
/**
 * @category Lifecycle events
 */
export interface OnMenuBeforeUpdateTopicParams {
    original: Menu;
    menu: Menu;
}
/**
 * @category Lifecycle events
 */
export interface OnMenuAfterUpdateTopicParams {
    original: Menu;
    menu: Menu;
}
/**
 * @category Lifecycle events
 */
export interface OnMenuBeforeDeleteTopicParams {
    menu: Menu;
}
/**
 * @category Lifecycle events
 */
export interface OnMenuAfterDeleteTopicParams {
    menu: Menu;
}

interface CreateMenuInput {
    title: string;
    slug: string;
    description: string;
    items: any[];
}
/**
 * @category Menu
 */
export interface MenusCrud {
    getMenu(slug: string, options?: MenuGetOptions): Promise<Menu | null>;
    getPublicMenu(slug: string): Promise<Menu>;
    listMenus(params?: ListMenuParams): Promise<Menu[]>;
    createMenu(data: CreateMenuInput): Promise<Menu>;
    updateMenu(slug: string, data: Record<string, any>): Promise<Menu>;
    deleteMenu(slug: string): Promise<Menu>;
    /**
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    onBeforeMenuCreate: Topic<OnMenuBeforeCreateTopicParams>;
    /**
     * @deprecated
     */
    onAfterMenuCreate: Topic<OnMenuAfterCreateTopicParams>;
    /**
     * @deprecated
     */
    onBeforeMenuUpdate: Topic<OnMenuBeforeUpdateTopicParams>;
    /**
     * @deprecated
     */
    onAfterMenuUpdate: Topic<OnMenuAfterUpdateTopicParams>;
    /**
     * @deprecated
     */
    onBeforeMenuDelete: Topic<OnMenuBeforeDeleteTopicParams>;
    /**
     * @deprecated
     */
    onAfterMenuDelete: Topic<OnMenuAfterDeleteTopicParams>;
    /**
     * Lifecycle events introduced in 5.34.0
     */
    onMenuBeforeCreate: Topic<OnMenuBeforeCreateTopicParams>;
    onMenuAfterCreate: Topic<OnMenuAfterCreateTopicParams>;
    onMenuBeforeUpdate: Topic<OnMenuBeforeUpdateTopicParams>;
    onMenuAfterUpdate: Topic<OnMenuAfterUpdateTopicParams>;
    onMenuBeforeDelete: Topic<OnMenuBeforeDeleteTopicParams>;
    onMenuAfterDelete: Topic<OnMenuAfterDeleteTopicParams>;
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
        pages: [PageSpecialType, string | null | undefined, string, Page][];
    };
}
/**
 * @category Lifecycle events
 */
export interface OnSettingsBeforeUpdateTopicParams {
    original: Settings;
    settings: Settings;
    meta: SettingsUpdateTopicMetaParams;
}
/**
 * @category Lifecycle events
 */
export interface OnSettingsAfterUpdateTopicParams {
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
    ) => Promise<DefaultSettings | null>;
    updateSettings: (
        data: Record<string, any>,
        options?: { auth?: boolean } & DefaultSettingsCrudOptions
    ) => Promise<Settings>;
    /**
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    onBeforeSettingsUpdate: Topic<OnSettingsBeforeUpdateTopicParams>;
    /**
     * @deprecated
     */
    onAfterSettingsUpdate: Topic<OnSettingsAfterUpdateTopicParams>;
    /**
     * Lifecycle events introduced in 5.34.0
     */
    onSettingsBeforeUpdate: Topic<OnSettingsBeforeUpdateTopicParams>;
    onSettingsAfterUpdate: Topic<OnSettingsAfterUpdateTopicParams>;
}

/**
 * @category Lifecycle events
 */
export interface OnSystemBeforeInstallTopicParams {
    tenant: string;
}
/**
 * @category Lifecycle events
 */
export interface OnSystemAfterInstallTopicParams {
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
    /**
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    onBeforeInstall: Topic<OnSystemBeforeInstallTopicParams>;
    /**
     * @deprecated
     */
    onAfterInstall: Topic<OnSystemBeforeInstallTopicParams>;
    /**
     * Lifecycle events
     */
    onSystemBeforeInstall: Topic<OnSystemBeforeInstallTopicParams>;
    onSystemAfterInstall: Topic<OnSystemBeforeInstallTopicParams>;
}

export interface PbBlockCategoryInput {
    name: string;
    slug: string;
    icon: string;
    description: string;
}

/**
 * @category Lifecycle events
 */
export interface OnBeforeBlockCategoryCreateTopicParams {
    blockCategory: BlockCategory;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterBlockCategoryCreateTopicParams {
    blockCategory: BlockCategory;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeBlockCategoryUpdateTopicParams {
    original: BlockCategory;
    blockCategory: BlockCategory;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterBlockCategoryUpdateTopicParams {
    original: BlockCategory;
    blockCategory: BlockCategory;
}
/**
 * @category Lifecycle events
 */
export interface OnBeforeBlockCategoryDeleteTopicParams {
    blockCategory: BlockCategory;
}
/**
 * @category Lifecycle events
 */
export interface OnAfterBlockCategoryDeleteTopicParams {
    blockCategory: BlockCategory;
}

/**
 * @category BlockCategories
 */
export interface BlockCategoriesCrud {
    getBlockCategory(slug: string, options?: { auth: boolean }): Promise<BlockCategory | null>;
    listBlockCategories(): Promise<BlockCategory[]>;
    createBlockCategory(data: PbBlockCategoryInput): Promise<BlockCategory>;
    updateBlockCategory(slug: string, data: PbBlockCategoryInput): Promise<BlockCategory>;
    deleteBlockCategory(slug: string): Promise<BlockCategory>;
    /**
     * Lifecycle events
     */
    onBeforeBlockCategoryCreate: Topic<OnBeforeBlockCategoryCreateTopicParams>;
    onAfterBlockCategoryCreate: Topic<OnAfterBlockCategoryCreateTopicParams>;
    onBeforeBlockCategoryUpdate: Topic<OnBeforeBlockCategoryUpdateTopicParams>;
    onAfterBlockCategoryUpdate: Topic<OnAfterBlockCategoryUpdateTopicParams>;
    onBeforeBlockCategoryDelete: Topic<OnBeforeBlockCategoryDeleteTopicParams>;
    onAfterBlockCategoryDelete: Topic<OnAfterBlockCategoryDeleteTopicParams>;
}

export interface ListPageBlocksParams {
    sort?: string[];
    where?: {
        blockCategory?: string;
    };
}
/**
 * @category Lifecycle events
 */
export interface OnPageBlockBeforeCreateTopicParams {
    pageBlock: PageBlock;
}

/**
 * @category Lifecycle events
 */
export interface OnPageBlockAfterCreateTopicParams {
    pageBlock: PageBlock;
}

/**
 * @category Lifecycle events
 */
export interface OnPageBlockBeforeUpdateTopicParams {
    original: PageBlock;
    pageBlock: PageBlock;
}

/**
 * @category Lifecycle events
 */
export interface OnPageBlockAfterUpdateTopicParams {
    original: PageBlock;
    pageBlock: PageBlock;
}

/**
 * @category Lifecycle events
 */
export interface OnPageBlockBeforeDeleteTopicParams {
    pageBlock: PageBlock;
}

/**
 * @category Lifecycle events
 */
export interface OnPageBlockAfterDeleteTopicParams {
    pageBlock: PageBlock;
}

export type PageBlockCreateInput = Omit<
    PageBlock,
    "id" | "tenant" | "locale" | "createdBy" | "createdOn"
>;

export type PageBlockUpdateInput = Partial<PageBlockCreateInput>;

/**
 * @category PageBlocks
 */
export interface PageBlocksCrud {
    getPageBlock(id: string): Promise<PageBlock | null>;
    listPageBlocks(params?: ListPageBlocksParams): Promise<PageBlock[]>;
    createPageBlock(data: PageBlockCreateInput): Promise<PageBlock>;
    updatePageBlock(id: string, data: PageBlockUpdateInput): Promise<PageBlock>;
    deletePageBlock(id: string): Promise<boolean>;
    resolvePageBlocks(content: Record<string, any> | null): Promise<any>;

    /**
     * Lifecycle events
     */
    onPageBlockBeforeCreate: Topic<OnPageBlockBeforeCreateTopicParams>;
    onPageBlockAfterCreate: Topic<OnPageBlockAfterCreateTopicParams>;
    onPageBlockBeforeUpdate: Topic<OnPageBlockBeforeUpdateTopicParams>;
    onPageBlockAfterUpdate: Topic<OnPageBlockAfterUpdateTopicParams>;
    onPageBlockBeforeDelete: Topic<OnPageBlockBeforeDeleteTopicParams>;
    onPageBlockAfterDelete: Topic<OnPageBlockAfterDeleteTopicParams>;
}

export interface ListPageTemplatesParams {
    sort?: string[];
}
/**
 * @category Lifecycle events
 */
export interface OnPageTemplateBeforeCreateTopicParams {
    pageTemplate: PageTemplate;
}

/**
 * @category Lifecycle events
 */
export interface OnPageTemplateAfterCreateTopicParams {
    pageTemplate: PageTemplate;
}

/**
 * @category Lifecycle events
 */
export interface OnPageTemplateBeforeUpdateTopicParams {
    original: PageTemplate;
    pageTemplate: PageTemplate;
}

/**
 * @category Lifecycle events
 */
export interface OnPageTemplateAfterUpdateTopicParams {
    original: PageTemplate;
    pageTemplate: PageTemplate;
}

/**
 * @category Lifecycle events
 */
export interface OnPageTemplateBeforeDeleteTopicParams {
    pageTemplate: PageTemplate;
}

/**
 * @category Lifecycle events
 */
export interface OnPageTemplateAfterDeleteTopicParams {
    pageTemplate: PageTemplate;
}

interface CreatePageFromTemplateParams {
    id?: string;
    slug?: string;
    path?: string;
    meta?: Record<string, any>;
}

export interface PageBlockVariable {
    id: string;
    label: string;
    type: string;
    value: string;
}

export interface PageTemplateVariable {
    blockId: string;
    variables: PageBlockVariable[];
}

interface GetPageTemplateParams {
    where: {
        id?: string;
        slug?: string;
    };
}

export interface PageContentWithTemplate extends PbPageElement {
    data: {
        template: {
            slug: string;
            variables?: PageTemplateVariable[];
        };
    };
}

/**
 * @category PageTemplates
 */
export interface PageTemplatesCrud {
    getPageTemplate(
        params: GetPageTemplateParams,
        options?: {
            auth: boolean;
        }
    ): Promise<PageTemplate | null>;
    listPageTemplates(params?: ListPageTemplatesParams): Promise<PageTemplate[]>;
    createPageTemplate(data: PageTemplateInput): Promise<PageTemplate>;
    createPageFromTemplate(data: CreatePageFromTemplateParams): Promise<Page>;
    createTemplateFromPage(
        pageId: string,
        data: Pick<PageTemplate, "title" | "description" | "slug">
    ): Promise<PageTemplate>;
    // Copy relevant data from page template to page instance, by reference.
    copyTemplateDataToPage(template: PageTemplate, page: Page): void;
    updatePageTemplate(id: string, data: Record<string, any>): Promise<PageTemplate>;
    deletePageTemplate(id: string): Promise<PageTemplate>;
    resolvePageTemplate(content: PageContentWithTemplate): Promise<any>;

    /**
     * Lifecycle events
     */
    onPageTemplateBeforeCreate: Topic<OnPageTemplateBeforeCreateTopicParams>;
    onPageTemplateAfterCreate: Topic<OnPageTemplateAfterCreateTopicParams>;
    onPageTemplateBeforeUpdate: Topic<OnPageTemplateBeforeUpdateTopicParams>;
    onPageTemplateAfterUpdate: Topic<OnPageTemplateAfterUpdateTopicParams>;
    onPageTemplateBeforeDelete: Topic<OnPageTemplateBeforeDeleteTopicParams>;
    onPageTemplateAfterDelete: Topic<OnPageTemplateAfterDeleteTopicParams>;
}

export interface PageBuilderContextObject
    extends PagesCrud,
        PageElementsCrud,
        CategoriesCrud,
        BlockCategoriesCrud,
        PageBlocksCrud,
        PageTemplatesCrud,
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
    extends BaseContext,
        I18NContext,
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

export interface PageSecurityPermission extends PbSecurityPermission {
    name: "pb.page";

    // Determines which of the following publishing workflow actions are allowed:
    // "p" - publish
    // "u" - unpublish
    pw: string;
}

// Page Builder lifecycle events.
export interface PageBeforeRenderEvent extends Pick<RenderParams, "paths" | "tags"> {
    args: {
        render?: RenderEvent[];
        queue?: QueueAddJob[];
    };
}

export interface PageAfterRenderEvent extends Pick<RenderParams, "paths" | "tags"> {
    args: {
        render?: RenderEvent[];
        queue?: QueueAddJob[];
    };
}

export interface PageBeforeFlushEvent extends Pick<FlushParams, "paths" | "tags"> {
    args: {
        flush?: FlushEvent[];
        queue?: QueueAddJob[];
    };
}

export interface PageAfterFlushEvent extends Pick<FlushParams, "paths" | "tags"> {
    args: {
        flush?: FlushEvent[];
        queue?: QueueAddJob[];
    };
}

// Prerendering configuration.
export interface Tag {
    key: string;
    value?: string | boolean;
}

export interface TagItem {
    tag: Tag;
}

export interface PathItem {
    path: string;
    exclude?: string[];
    tags?: Tag[];
}

export interface RenderParams {
    queue?: boolean;
    tags?: TagItem[];
    paths?: PathItem[];
}

export interface FlushParams {
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

export interface PbUpdatePageInput {
    title?: string;
    category?: string;
    path?: string;
    settings?: PageSettings;
    content?: Record<string, any> | null;
}
