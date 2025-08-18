import type { WbIdentity, WbLocation } from "~/context/types";
import type {
    CmsEntryGetParams,
    CmsEntryListSort,
    CmsEntryListWhere
} from "@webiny/api-headless-cms/types";
import type { Topic } from "@webiny/pubsub/types";
import type { ListWbPagesParams, WbListMeta } from "~/features/pages/ListPages/IListPages";

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

export type WbPagesStorageOperationsGetParams = CmsEntryGetParams;

export interface WbPagesStorageOperationsCreateParams {
    data: CreateWbPageData;
}

export interface WbPagesStorageOperationsUpdateParams {
    id: string;
    data: UpdateWbPageData;
}

export type WbPagesStorageOperationsPublishParams = PublishWbPageParams;

export type WbPagesStorageOperationsUnpublishParams = UnpublishWbPageParams;

export type WbPagesStorageOperationsMoveParams = MoveWbPageParams;

export type WbPagesStorageOperationsCreateRevisionFromParams = CreateWbPageRevisionFromParams;

export interface WbPagesStorageOperationsDeleteParams {
    id: string;
}

export interface WbPagesStorageOperationsListParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export type WbPagesStorageOperationsListResponse = [WbPage[], WbListMeta];

export interface OnPageBeforeCreateTopicParams {
    input: CreateWbPageData;
}

export interface OnPageAfterCreateTopicParams {
    page: WbPage;
}

export interface OnPageBeforeUpdateTopicParams {
    original: WbPage;
    input: Record<string, any>;
}

export interface OnPageAfterUpdateTopicParams {
    original: WbPage;
    page: WbPage;
    input: Record<string, any>;
}

export interface OnPageBeforePublishTopicParams {
    page: WbPage;
}

export interface OnPageAfterPublishTopicParams {
    page: WbPage;
}

export interface OnPageBeforeUnpublishTopicParams {
    page: WbPage;
}

export interface OnPageAfterUnpublishTopicParams {
    page: WbPage;
}

export interface OnPageBeforeDuplicateTopicParams {
    original: WbPage;
}

export interface OnPageAfterDuplicateTopicParams {
    original: WbPage;
    page: WbPage;
}

export interface OnPageBeforeCreateRevisionFromTopicParams {
    original: WbPage;
}

export interface OnPageAfterCreateRevisionFromTopicParams {
    original: WbPage;
    page: WbPage;
}

export interface OnPageBeforeMoveTopicParams {
    page: WbPage;
    folderId: string;
}

export interface OnPageAfterMoveTopicParams {
    page: WbPage;
    folderId: string;
}

export interface OnPageBeforeDeleteTopicParams {
    page: WbPage;
}

export interface OnPageAfterDeleteTopicParams {
    page: WbPage;
}

export interface WbPagesStorageOperations {
    /**
     * Get a published page using a filter.
     */
    get: (params: WbPagesStorageOperationsGetParams) => Promise<WbPage | null>;
    /**
     * Get a single page by ID (can be draft or published).
     */
    getById: (id: string) => Promise<WbPage | null>;
    /**
     * Get all revisions for the given page.
     */
    getRevisions: (pageId: string) => Promise<WbPage[]>;
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
    getById(id: string): Promise<WbPage | null>;
    /**
     * Get a single published page by given path.
     */
    getByPath(path: string): Promise<WbPage | null>;

    /**
     * Get information about page revisions.
     */
    getRevisions(entryId: string): Promise<WbPage[]>;
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

    onPageBeforeCreate: Topic<OnPageBeforeCreateTopicParams>;
    onPageAfterCreate: Topic<OnPageAfterCreateTopicParams>;
    onPageBeforeUpdate: Topic<OnPageBeforeUpdateTopicParams>;
    onPageAfterUpdate: Topic<OnPageAfterUpdateTopicParams>;
    onPageBeforePublish: Topic<OnPageBeforePublishTopicParams>;
    onPageAfterPublish: Topic<OnPageAfterPublishTopicParams>;
    onPageBeforeUnpublish: Topic<OnPageBeforeUnpublishTopicParams>;
    onPageAfterUnpublish: Topic<OnPageAfterUnpublishTopicParams>;
    onPageBeforeDuplicate: Topic<OnPageBeforeDuplicateTopicParams>;
    onPageAfterDuplicate: Topic<OnPageAfterDuplicateTopicParams>;
    onPageBeforeMove: Topic<OnPageBeforeMoveTopicParams>;
    onPageAfterMove: Topic<OnPageAfterMoveTopicParams>;
    onPageBeforeCreateRevisionFrom: Topic<OnPageBeforeCreateRevisionFromTopicParams>;
    onPageAfterCreateRevisionFrom: Topic<OnPageAfterCreateRevisionFromTopicParams>;
    onPageBeforeDelete: Topic<OnPageBeforeDeleteTopicParams>;
    onPageAfterDelete: Topic<OnPageAfterDeleteTopicParams>;
}
