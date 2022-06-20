import { DefaultSettingsCrudOptions, PbContext } from "~/graphql/types";
import { UpgradePlugin } from "@webiny/api-upgrade";

export * from "./graphql/types";

/**
 * @category RecordModel
 */
export interface PageElement {
    id: string;
    name: string;
    type: "element" | "block";
    category: string;
    content: File;
    preview: File;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
}
/**
 * @category RecordModel
 */
export interface Menu {
    title: string;
    slug: string;
    description: string;
    items: any[];
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
}
export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}
/**
 * @category RecordModel
 */
export interface Category {
    name: string;
    slug: string;
    url: string;
    layout: string;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
}

export type PageStatus =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";
export type PageSpecialType = "home" | "notFound";

export interface PageSettings {
    social?: {
        title: string;
        description: string;
        image: File;
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
        image: File;
    };
}
export interface Page {
    id: string;
    pid: string;
    locale: string;
    tenant: string;
    title: string;
    editor: string;
    createdFrom: string | null;
    path: string;
    category: string;
    content: Record<string, any> | null;
    publishedOn: string | null;
    version: number;
    settings?: PageSettings;
    locked: boolean;
    status: PageStatus;
    createdOn: string;
    savedOn: string;
    createdBy: CreatedBy;
    ownedBy: CreatedBy;
    webinyVersion: string;
}

export interface File {
    id: string;
    src: string;
}

export interface MetaResponse {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsGetParams {
    where: {
        tenant: string;
        locale: string;
        slug: string;
    };
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsListParams {
    where: {
        tenant: string;
        locale: string;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export type CategoryStorageOperationsListResponse = [Category[], MetaResponse];

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsCreateParams {
    input: Record<string, any>;
    category: Category;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: Category;
    category: Category;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsDeleteParams {
    category: Category;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperations {
    /**
     * Get the category by given slug.
     */
    get(params: CategoryStorageOperationsGetParams): Promise<Category | null>;
    /**
     * List all the categories.
     */
    list(
        params: CategoryStorageOperationsListParams
    ): Promise<CategoryStorageOperationsListResponse>;
    create(params: CategoryStorageOperationsCreateParams): Promise<Category>;
    update(params: CategoryStorageOperationsUpdateParams): Promise<Category>;
    delete(params: CategoryStorageOperationsDeleteParams): Promise<Category>;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsGetParams {
    where: {
        slug: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsListParams {
    where: {
        tenant: string;
        locale: string;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export type MenuStorageOperationsListResponse = [Menu[], MetaResponse];

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsCreateParams {
    input: Record<string, any>;
    menu: Menu;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: Menu;
    menu: Menu;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsDeleteParams {
    menu: Menu;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperations {
    /**
     * Get a single menu item by given params.
     */
    get(params: MenuStorageOperationsGetParams): Promise<Menu>;
    /**
     * Get all menu items by given params.
     */
    list(params: MenuStorageOperationsListParams): Promise<MenuStorageOperationsListResponse>;
    create(params: MenuStorageOperationsCreateParams): Promise<Menu>;
    update(params: MenuStorageOperationsUpdateParams): Promise<Menu>;
    delete(params: MenuStorageOperationsDeleteParams): Promise<Menu>;
}

/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export interface PageElementStorageOperationsGetParams {
    where: {
        id: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export interface PageElementStorageOperationsListParams {
    where: {
        tenant: string;
        locale: string;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}
/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export type PageElementStorageOperationsListResponse = [PageElement[], MetaResponse];

/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export interface PageElementStorageOperationsCreateParams {
    input: Record<string, any>;
    pageElement: PageElement;
}

/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export interface PageElementStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: PageElement;
    pageElement: PageElement;
}

/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export interface PageElementStorageOperationsDeleteParams {
    pageElement: PageElement;
}

/**
 * @category StorageOperations
 * @category PageElementStorageOperations
 */
export interface PageElementStorageOperations {
    /**
     * Get a single page element item by given params.
     */
    get(params: PageElementStorageOperationsGetParams): Promise<PageElement | null>;
    /**
     * Get all page element items by given params.
     */
    list(
        params: PageElementStorageOperationsListParams
    ): Promise<PageElementStorageOperationsListResponse>;
    create(params: PageElementStorageOperationsCreateParams): Promise<PageElement>;
    update(params: PageElementStorageOperationsUpdateParams): Promise<PageElement>;
    delete(params: PageElementStorageOperationsDeleteParams): Promise<PageElement>;
}

/**
 * @category RecordModel
 */
export interface System {
    version: string;
    tenant: string;
}
/**
 * @category StorageOperations
 * @category SystemStorageOperations
 */
export interface SystemStorageOperationsGetParams {
    tenant: string;
}
/**
 * @category StorageOperations
 * @category SystemStorageOperations
 */
export interface SystemStorageOperationsCreateParams {
    system: System;
}
/**
 * @category StorageOperations
 * @category SystemStorageOperations
 */
export interface SystemStorageOperationsUpdateParams {
    original: System;
    system: System;
}
/**
 * @category StorageOperations
 * @category SystemStorageOperations
 */
export interface SystemStorageOperations {
    get: (params: SystemStorageOperationsGetParams) => Promise<System | null>;
    create(params: SystemStorageOperationsCreateParams): Promise<System>;
    update(params: SystemStorageOperationsUpdateParams): Promise<System>;
}

/**
 * @category RecordModel
 */
export interface Settings {
    name: string;
    websiteUrl: string;
    websitePreviewUrl: string;
    favicon: File;
    logo: File;
    prerendering: {
        app: {
            url: string;
        };
        storage: {
            name: string;
        };
        meta: Record<string, any>;
    };
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        image: File;
    };
    pages: {
        home: string;
        notFound: string;
    };
    type: string;
    tenant: string | undefined | false;
    locale: string | undefined | false;
}
/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 */
export interface SettingsStorageOperationsGetParams {
    where: {
        type: string;
        tenant: string | undefined | false;
        locale: string | undefined | false;
    };
}
/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 */
export interface SettingsStorageOperationsCreateParams {
    input: Record<string, any>;
    settings: Settings;
}
/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 */
export interface SettingsStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: Settings;
    settings: Settings;
}
/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 */
export interface SettingsStorageOperations {
    /**
     * To identify different settings (global, default, per tenant, per locale) we must have some kind of identifier.
     * In our initial code it was the partition key and sort key combined.
     * Different storage operations can have what ever suits those storages.
     */
    createCacheKey: (params: DefaultSettingsCrudOptions) => string;
    get: (params: SettingsStorageOperationsGetParams) => Promise<Settings | null>;
    create: (params: SettingsStorageOperationsCreateParams) => Promise<Settings>;
    update: (params: SettingsStorageOperationsUpdateParams) => Promise<Settings>;
}

/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsListResponse {
    items: Page[];
    meta: MetaResponse;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsGetWhereParams {
    /**
     * pid + version
     */
    id?: string;
    pid?: string;
    version?: number;
    path?: string;
    published?: boolean;
    latest?: boolean;
    tenant: string;
    locale: string;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsGetParams {
    where: PageStorageOperationsGetWhereParams;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsGetByPathWhereParams {
    path: string;
    tenant: string;
    locale: string;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsGetByPathParams {
    where: PageStorageOperationsGetByPathWhereParams;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsListWhere {
    /**
     * pid + version
     */
    id?: string;
    pid?: string;
    search?: string;
    title_contains?: string;
    createdBy?: string;
    tenant: string;
    locale: string;
    pid_not_in?: string[];
    path_not_in?: string[];
    tags_in?: string[];
    tags_and_in?: string[];
    /**
     * This is special condition which should not be transformed into database query but its used to determine
     * if pages we are trying to load need to have any of given tags or all of them.
     */
    tags_rule?: "all" | "any";
    /**
     * It should always be either latest or published defined as true.
     * If both are not defined, storage operations should throw an error.
     */
    latest?: boolean;
    published?: boolean;
}

/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsListParams {
    where: PageStorageOperationsListWhere;
    sort: string[];
    limit: number;
    after: string | null;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsListRevisionsParams {
    where: {
        pid: string;
        tenant: string;
        locale: string;
    };
    sort: string[];
    limit: number;
    after?: string;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsListTagsParams {
    where: {
        search: string;
        locale: string;
        tenant: string;
    };
}

/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsCreateParams {
    input: Record<string, any>;
    page: Page;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsCreateFromParams {
    original: Page;
    latestPage: Page;
    page: Page;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: Page;
    page: Page;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsDeleteParams {
    page: Page;
    latestPage: Page;
    publishedPage: Page | null;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsDeleteAllParams {
    page: Page;
    latestPage: Page;
    publishedPage: Page | null;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsPublishParams {
    original: Page;
    page: Page;
    latestPage: Page;
    publishedPage: Page | null;
    publishedPathPage: Page | null;
}
/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsUnpublishParams {
    original: Page;
    page: Page;
    latestPage: Page;
}

/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsRequestReviewParams {
    original: Page;
    page: Page;
    latestPage: Page;
}

/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperationsRequestChangesParams {
    original: Page;
    page: Page;
    latestPage: Page;
}

/**
 * @category StorageOperations
 * @category PageStorageOperations
 */
export interface PageStorageOperations {
    get: (params: PageStorageOperationsGetParams) => Promise<Page | null>;
    list: (params: PageStorageOperationsListParams) => Promise<PageStorageOperationsListResponse>;
    listRevisions: (params: PageStorageOperationsListRevisionsParams) => Promise<Page[]>;
    listTags: (params: PageStorageOperationsListTagsParams) => Promise<string[]>;
    create: (params: PageStorageOperationsCreateParams) => Promise<Page>;
    createFrom: (params: PageStorageOperationsCreateFromParams) => Promise<Page>;
    update: (params: PageStorageOperationsUpdateParams) => Promise<Page>;
    /**
     * Deletes a certain page version.
     * If required set new latest and published pages.
     * Second page in the tuple must be new latest page, if any.
     */
    delete: (params: PageStorageOperationsDeleteParams) => Promise<[Page, Page | null]>;
    /**
     * Deletes ALL of the certain page versions.
     */
    deleteAll: (params: PageStorageOperationsDeleteAllParams) => Promise<[Page]>;
    publish: (params: PageStorageOperationsPublishParams) => Promise<Page>;
    unpublish: (params: PageStorageOperationsUnpublishParams) => Promise<Page>;
    requestReview: (params: PageStorageOperationsRequestReviewParams) => Promise<Page>;
    requestChanges: (params: PageStorageOperationsRequestChangesParams) => Promise<Page>;
}

export interface PageBuilderStorageOperations {
    system: SystemStorageOperations;
    settings: SettingsStorageOperations;
    categories: CategoryStorageOperations;
    menus: MenuStorageOperations;
    pageElements: PageElementStorageOperations;
    pages: PageStorageOperations;

    beforeInit?: (context: PbContext) => Promise<void>;
    init?: (context: PbContext) => Promise<void>;
    /**
     * An upgrade to run if necessary.
     */
    upgrade?: UpgradePlugin | null;
}
