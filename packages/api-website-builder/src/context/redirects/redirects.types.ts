import type { WbIdentity, WbLocation } from "~/context/types";
import { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import type { Topic } from "@webiny/pubsub/types";
import {
    ListWbRedirectsParams,
    WbListMeta
} from "~/features/redirects/ListRedirects/IListRedirects";

export interface WbRedirect {
    id: string;
    wbyAco_location: WbLocation;
    createdOn: string;
    createdBy: WbIdentity;
    savedOn: string;
    savedBy: WbIdentity;
    modifiedOn: string;
    modifiedBy: WbIdentity;
    tenant: string;
    locale: string;

    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}

export type CreateWbRedirectData = Pick<
    WbRedirect,
    "redirectFrom" | "redirectTo" | "redirectType" | "isEnabled"
>;

export interface UpdateWbRedirectData {
    location?: WbLocation;
    redirectFrom?: string;
    redirectTo?: string;
    redirectType?: string;
    isEnabled?: boolean;
}

export interface DeleteWbRedirectParams {
    id: string;
}

export interface MoveWbRedirectParams {
    id: string;
    folderId: string;
}

export interface WbRedirectsStorageOperationsCreateParams {
    data: CreateWbRedirectData;
}

export interface WbRedirectsStorageOperationsUpdateParams {
    id: string;
    data: UpdateWbRedirectData;
}

export interface WbRedirectsStorageOperationsDeleteParams {
    id: string;
}

export type WbRedirectsStorageOperationsMoveParams = MoveWbRedirectParams;

export interface WbRedirectsStorageOperationsListParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export type WbRedirectsStorageOperationsListResponse = [WbRedirect[], WbListMeta];

export interface OnRedirectBeforeCreateTopicParams {
    input: CreateWbRedirectData;
}

export interface OnRedirectAfterCreateTopicParams {
    redirect: WbRedirect;
}

export interface OnRedirectBeforeUpdateTopicParams {
    original: WbRedirect;
    input: Record<string, any>;
}

export interface OnRedirectAfterUpdateTopicParams {
    original: WbRedirect;
    redirect: WbRedirect;
    input: Record<string, any>;
}

export interface OnRedirectBeforeMoveTopicParams {
    redirect: WbRedirect;
    folderId: string;
}

export interface OnRedirectAfterMoveTopicParams {
    redirect: WbRedirect;
    folderId: string;
}

export interface OnRedirectBeforeDeleteTopicParams {
    redirect: WbRedirect;
}

export interface OnRedirectAfterDeleteTopicParams {
    redirect: WbRedirect;
}

export interface WbRedirectsStorageOperations {
    /**
     * Get a single redirect by ID (can be draft or published).
     */
    getById: (id: string) => Promise<WbRedirect | null>;
    /**
     * Get a list of redirects filtered by given parameters.
     */
    list: (
        params: WbRedirectsStorageOperationsListParams
    ) => Promise<WbRedirectsStorageOperationsListResponse>;
    /**
     * Insert the redirect data into the database.
     */
    create: (params: WbRedirectsStorageOperationsCreateParams) => Promise<WbRedirect>;
    /**
     * Update the redirect data in the database.
     */
    update: (params: WbRedirectsStorageOperationsUpdateParams) => Promise<WbRedirect>;
    /**
     * Move the redirect into a folder and store the information in the database.
     */
    move: (params: MoveWbRedirectParams) => Promise<void>;
    /**
     * Delete the redirect from the database.
     */
    delete: (params: WbRedirectsStorageOperationsDeleteParams) => Promise<void>;
}

export interface WbRedirectCrud {
    /**
     * Get a single redirect with given ID from the storage.
     */
    getById(id: string): Promise<WbRedirect | null>;
    /**
     * Get a list of redirects filtered by given parameters.
     */
    list(params: ListWbRedirectsParams): Promise<[WbRedirect[], WbListMeta]>;
    /**
     * Create a new redirect in the storage.
     */
    create(data: CreateWbRedirectData): Promise<WbRedirect>;
    /**
     * Update an existing redirect in the storage.
     */
    update(id: string, data: UpdateWbRedirectData): Promise<WbRedirect>;
    /**
     * Move a redirect into a folder
     */
    move(params: MoveWbRedirectParams): Promise<void>;
    /**
     * Delete a redirect from the storage.
     */
    delete(params: DeleteWbRedirectParams): Promise<void>;

    onRedirectBeforeCreate: Topic<OnRedirectBeforeCreateTopicParams>;
    onRedirectAfterCreate: Topic<OnRedirectAfterCreateTopicParams>;
    onRedirectBeforeUpdate: Topic<OnRedirectBeforeUpdateTopicParams>;
    onRedirectAfterUpdate: Topic<OnRedirectAfterUpdateTopicParams>;
    onRedirectBeforeMove: Topic<OnRedirectBeforeMoveTopicParams>;
    onRedirectAfterMove: Topic<OnRedirectAfterMoveTopicParams>;
    onRedirectBeforeDelete: Topic<OnRedirectBeforeDeleteTopicParams>;
    onRedirectAfterDelete: Topic<OnRedirectAfterDeleteTopicParams>;
}
