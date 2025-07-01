import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import {
    type GetPermissions,
    SecurityContext,
    type SecurityIdentity
} from "@webiny/api-security/types";
import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { CmsContext, type CmsEntryListSort } from "@webiny/api-headless-cms/types";
import type { Topic } from "@webiny/pubsub/types";

export interface WbPage {
    id: string;
    location?: {
        folderId: string;
    };
    tenant: string;
    locale: string;
    webinyVersion: string;
    [key: string]: any;
}

export interface OnWebsiteBuilderPageBeforeCreateTopicParams {
    input: any;
}

export interface OnWebsiteBuilderPageAfterCreateTopicParams {
    page: WbPage;
}

export interface OnWebsiteBuilderPageBeforeUpdateTopicParams {
    original: WbPage;
    input: Record<string, any>;
}

export interface OnWebsiteBuilderPageAfterUpdateTopicParams {
    original: WbPage;
    page: WbPage;
    input: Record<string, any>;
}

export interface OnWebsiteBuilderPageBeforeDeleteTopicParams {
    page: WbPage;
}

export interface OnWebsiteBuilderPageAfterDeleteTopicParams {
    page: WbPage;
}

export interface WebsiteBuilderPageCrud {
    get(): Promise<void>;

    list(): Promise<void>;

    create(): Promise<void>;

    update(): Promise<void>;

    delete(): Promise<void>;

    onWebsiteBuilderPageBeforeCreate: Topic<OnWebsiteBuilderPageBeforeCreateTopicParams>;
    onWebsiteBuilderPageAfterCreate: Topic<OnWebsiteBuilderPageAfterCreateTopicParams>;
    onWebsiteBuilderPageBeforeUpdate: Topic<OnWebsiteBuilderPageBeforeUpdateTopicParams>;
    onWebsiteBuilderPageAfterUpdate: Topic<OnWebsiteBuilderPageAfterUpdateTopicParams>;
    onWebsiteBuilderPageBeforeDelete: Topic<OnWebsiteBuilderPageBeforeDeleteTopicParams>;
    onWebsiteBuilderPageAfterDelete: Topic<OnWebsiteBuilderPageAfterDeleteTopicParams>;
}

export interface WebsiteBuilderContextObject {
    page: WebsiteBuilderPageCrud;
}

export interface WebsiteBuilderContext
    extends BaseContext,
        I18NContext,
        TenancyContext,
        SecurityContext,
        AdminUsersContext,
        CmsContext {
    websiteBuilder: WebsiteBuilderContextObject;
}

export interface WebsiteBuilderConfig {
    storageOperations: WebsiteBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    getPermissions: GetPermissions;
    WEBINY_VERSION: string;
}

export interface WebsiteBuilderStorageOperations {
    pages: WebsiteBuilderPagesStorageOperations;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsGetParams {
    where: {
        id: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsCreateParams {
    page: WbPage;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsUpdateParams {
    original: WbPage;
    page: WbPage;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsDeleteParams {
    page: WbPage;
}

/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsListParamsWhere {
    [key: string]: any;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsListParams {
    where: WebsiteBuilderPagesStorageOperationsListParamsWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WebsiteBuilderPagesStorageOperationsListResponseMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}
export type WebsiteBuilderPagesStorageOperationsListResponse = [
    WbPage[],
    WebsiteBuilderPagesStorageOperationsListResponseMeta
];

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 */
export interface WebsiteBuilderPagesStorageOperations {
    /**
     * Get a single page with given ID from the storage.
     */
    get: (params: WebsiteBuilderPagesStorageOperationsGetParams) => Promise<WbPage | null>;
    /**
     * Insert the page data into the database.
     */
    create: (params: WebsiteBuilderPagesStorageOperationsCreateParams) => Promise<WbPage>;
    /**
     * Update the page data in the database.
     */
    update: (params: WebsiteBuilderPagesStorageOperationsUpdateParams) => Promise<WbPage>;
    /**
     * Delete the page from the database.
     */
    delete: (params: WebsiteBuilderPagesStorageOperationsDeleteParams) => Promise<void>;
    /**
     * Get a list of pages filtered by given parameters.
     */
    list: (
        params: WebsiteBuilderPagesStorageOperationsListParams
    ) => Promise<WebsiteBuilderPagesStorageOperationsListResponse>;
}
