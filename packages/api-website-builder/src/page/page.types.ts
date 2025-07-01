import type { WbListMeta, WbLocation } from "~/types";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types";
import type { Topic } from "@webiny/pubsub/types";

export interface WbPage {
    id: string;
    entryId: string;
    location?: WbLocation;
    properties: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions?: Record<string, any>;
}

export type CreateWbPageData = Pick<WbPage, "properties" | "bindings" | "elements" | "location">;

export interface UpdateWbPageData {
    location?: WbLocation;
    properties?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
}

export interface DeleteWbPageData {
    id: string;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsGetParams {
    id?: string;
    path?: string;
    templateSlug?: string;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsCreateParams {
    data: CreateWbPageData;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsUpdateParams {
    id: string;
    data: UpdateWbPageData;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export type WbPagesStorageOperationsDeleteParams = DeleteWbPageData;

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsListParamsWhere {
    [key: string]: any;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsListParams {
    where: WbPagesStorageOperationsListParamsWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsResponse
 */
export type WbPagesStorageOperationsListResponse = [WbPage[], WbListMeta];

export interface OnWebsiteBuilderPageBeforeCreateTopicParams {
    input: CreateWbPageData;
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

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 */
export interface WbPagesStorageOperations {
    /**
     * Get a single page with given ID from the storage.
     */
    get: (params: WbPagesStorageOperationsGetParams) => Promise<WbPage | null>;
    /**
     * Insert the page data into the database.
     */
    create: (params: WbPagesStorageOperationsCreateParams) => Promise<WbPage>;
    /**
     * Update the page data in the database.
     */
    update: (params: WbPagesStorageOperationsUpdateParams) => Promise<WbPage>;
    /**
     * Delete the page from the database.
     */
    delete: (params: WbPagesStorageOperationsDeleteParams) => Promise<void>;
    /**
     * Get a list of pages filtered by given parameters.
     */
    list: (
        params: WbPagesStorageOperationsListParams
    ) => Promise<WbPagesStorageOperationsListResponse>;
}

export interface WbPageCrud {
    /**
     * Get a single page with given ID from the storage.
     */
    get(): Promise<void>;
    /**
     * Get a list of pages filtered by given parameters.
     */
    list(): Promise<void>;
    /**
     * Create a new page in the storage.
     */
    create(): Promise<void>;
    /**
     * Update an existing page in the storage.
     */
    update(): Promise<void>;
    /**
     * Delete a page from the storage.
     */
    delete(): Promise<void>;

    onWebsiteBuilderPageBeforeCreate: Topic<OnWebsiteBuilderPageBeforeCreateTopicParams>;
    onWebsiteBuilderPageAfterCreate: Topic<OnWebsiteBuilderPageAfterCreateTopicParams>;
    onWebsiteBuilderPageBeforeUpdate: Topic<OnWebsiteBuilderPageBeforeUpdateTopicParams>;
    onWebsiteBuilderPageAfterUpdate: Topic<OnWebsiteBuilderPageAfterUpdateTopicParams>;
    onWebsiteBuilderPageBeforeDelete: Topic<OnWebsiteBuilderPageBeforeDeleteTopicParams>;
    onWebsiteBuilderPageAfterDelete: Topic<OnWebsiteBuilderPageAfterDeleteTopicParams>;
}
