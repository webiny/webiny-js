import type { WbIdentity, WbListMeta, WbLocation } from "~/types";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import type { Topic } from "@webiny/pubsub/types";

export interface WbPage {
    id: string;
    entryId: string;
    wbyAco_location: WbLocation;
    status: string;
    version: number;
    locked: boolean;
    createdOn: string;
    createdBy: WbIdentity;
    savedOn: string;
    savedBy: WbIdentity;
    modifiedOn: string;
    modifiedBy: WbIdentity;
    tenant: string;
    locale: string;
    webinyVersion: string;

    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface ListWbPagesParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export interface GetWbPageParams {
    id: string;
}

export type CreateWbPageData = Pick<
    WbPage,
    "properties" | "metadata" | "bindings" | "elements" | "wbyAco_location" | "extensions"
>;

export interface UpdateWbPageData {
    location?: WbLocation;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
}

export interface DeleteWbPageParams {
    id: string;
}

export interface DuplicateWbPageParams {
    id: string;
}

export interface PublishWbPageParams {
    id: string;
}

export interface UnpublishWbPageParams {
    id: string;
}

export interface MoveWbPageParams {
    id: string;
    folderId: string;
}

export interface CreateWbPageRevisionFromParams {
    id: string;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsGetParams {
    id?: string;
    entryId?: string;
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
export type WbPagesStorageOperationsPublishParams = PublishWbPageParams;

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export type WbPagesStorageOperationsUnpublishParams = UnpublishWbPageParams;

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export type WbPagesStorageOperationsMoveParams = MoveWbPageParams;

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export type WbPagesStorageOperationsCreateRevisionFromParams = CreateWbPageRevisionFromParams;

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsDeleteParams {
    id: string;
}

/**
 * @category StorageOperations
 * @category PagesStorageOperations
 * @category PagesStorageOperationsParams
 */
export interface WbPagesStorageOperationsListParams {
    where: CmsEntryListWhere;
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

export interface OnWebsiteBuilderPageBeforePublishTopicParams {
    page: WbPage;
}

export interface OnWebsiteBuilderPageAfterPublishTopicParams {
    page: WbPage;
}

export interface OnWebsiteBuilderPageBeforeUnpublishTopicParams {
    page: WbPage;
}

export interface OnWebsiteBuilderPageAfterUnpublishTopicParams {
    page: WbPage;
}

export interface OnWebsiteBuilderPageBeforeDuplicateTopicParams {
    original: WbPage;
}

export interface OnWebsiteBuilderPageAfterDuplicateTopicParams {
    original: WbPage;
    page: WbPage;
}

export interface OnWebsiteBuilderPageBeforeCreateRevisionFromTopicParams {
    original: WbPage;
}

export interface OnWebsiteBuilderPageAfterCreateRevisionFromTopicParams {
    original: WbPage;
    page: WbPage;
}

export interface OnWebsiteBuilderPageBeforeMoveTopicParams {
    page: WbPage;
    folderId: string;
}

export interface OnWebsiteBuilderPageAfterMoveTopicParams {
    page: WbPage;
    folderId: string;
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
     * Get a list of pages filtered by given parameters.
     */
    list: (
        params: WbPagesStorageOperationsListParams
    ) => Promise<WbPagesStorageOperationsListResponse>;
    /**
     * Insert the page data into the database.
     */
    create: (params: WbPagesStorageOperationsCreateParams) => Promise<WbPage>;
    /**
     * Update the page data in the database.
     */
    update: (params: WbPagesStorageOperationsUpdateParams) => Promise<WbPage>;
    /**
     * Publish the page and store the information in the database.
     */
    publish: (params: WbPagesStorageOperationsPublishParams) => Promise<WbPage>;
    /**
     * Unpublish the page and store the information in the database.
     */
    unpublish: (params: WbPagesStorageOperationsUnpublishParams) => Promise<WbPage>;
    /**
     * Move the page into a folder and store the information in the database.
     */
    move: (params: MoveWbPageParams) => Promise<void>;
    /**
     * Create a page revision and store the information in the database.
     */
    createRevisionFrom: (params: CreateWbPageRevisionFromParams) => Promise<WbPage>;
    /**
     * Delete the page from the database.
     */
    delete: (params: WbPagesStorageOperationsDeleteParams) => Promise<void>;
}

export interface WbPageCrud {
    /**
     * Get a single page with given ID from the storage.
     */
    get(params: GetWbPageParams): Promise<WbPage | null>;
    /**
     * Get a list of pages filtered by given parameters.
     */
    list(params: ListWbPagesParams): Promise<[WbPage[], WbListMeta]>;
    /**
     * Create a new page in the storage.
     */
    create(data: CreateWbPageData): Promise<WbPage>;
    /**
     * Update an existing page in the storage.
     */
    update(id: string, data: UpdateWbPageData): Promise<WbPage>;
    /**
     * Duplicate a page and store it as a new page in the storage.
     */
    duplicate(params: DuplicateWbPageParams): Promise<WbPage>;
    /**
     * Publish a page.
     */
    publish(params: PublishWbPageParams): Promise<WbPage>;
    /**
     * Unpublish a page.
     */
    unpublish(params: UnpublishWbPageParams): Promise<WbPage>;
    /**
     * Move a page into a folder
     */
    move(params: MoveWbPageParams): Promise<void>;
    /**
     * Create a page revision from an id.
     */
    createRevisionFrom(params: CreateWbPageRevisionFromParams): Promise<WbPage>;
    /**
     * Delete a page from the storage.
     */
    delete(params: DeleteWbPageParams): Promise<void>;

    onWebsiteBuilderPageBeforeCreate: Topic<OnWebsiteBuilderPageBeforeCreateTopicParams>;
    onWebsiteBuilderPageAfterCreate: Topic<OnWebsiteBuilderPageAfterCreateTopicParams>;
    onWebsiteBuilderPageBeforeUpdate: Topic<OnWebsiteBuilderPageBeforeUpdateTopicParams>;
    onWebsiteBuilderPageAfterUpdate: Topic<OnWebsiteBuilderPageAfterUpdateTopicParams>;
    onWebsiteBuilderPageBeforePublish: Topic<OnWebsiteBuilderPageBeforePublishTopicParams>;
    onWebsiteBuilderPageAfterPublish: Topic<OnWebsiteBuilderPageAfterPublishTopicParams>;
    onWebsiteBuilderPageBeforeUnpublish: Topic<OnWebsiteBuilderPageBeforeUnpublishTopicParams>;
    onWebsiteBuilderPageAfterUnpublish: Topic<OnWebsiteBuilderPageAfterUnpublishTopicParams>;
    onWebsiteBuilderPageBeforeDuplicate: Topic<OnWebsiteBuilderPageBeforeDuplicateTopicParams>;
    onWebsiteBuilderPageAfterDuplicate: Topic<OnWebsiteBuilderPageAfterDuplicateTopicParams>;
    onWebsiteBuilderPageBeforeMove: Topic<OnWebsiteBuilderPageBeforeMoveTopicParams>;
    onWebsiteBuilderPageAfterMove: Topic<OnWebsiteBuilderPageAfterMoveTopicParams>;
    onWebsiteBuilderPageBeforeCreateRevisionFrom: Topic<OnWebsiteBuilderPageBeforeCreateRevisionFromTopicParams>;
    onWebsiteBuilderPageAfterCreateRevisionFrom: Topic<OnWebsiteBuilderPageAfterCreateRevisionFromTopicParams>;
    onWebsiteBuilderPageBeforeDelete: Topic<OnWebsiteBuilderPageBeforeDeleteTopicParams>;
    onWebsiteBuilderPageAfterDelete: Topic<OnWebsiteBuilderPageAfterDeleteTopicParams>;
}
