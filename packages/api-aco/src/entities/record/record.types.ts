import { AcoBaseFields, BaseAcoCrud, ListMeta } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Location {
    folderId: string;
}

export interface SearchRecord extends AcoBaseFields {
    originalId: string;
    type: string;
    title?: string;
    content?: string;
    location?: Location;
    data?: Record<string, any>;
}

export interface ListSearchRecordsWhere {
    type: string;
    location?: {
        folderId: string;
    };
}

export interface ListSearchRecordsParams {
    where?: ListSearchRecordsWhere;
    search?: string;
    sort?: string[];
    limit?: number;
    after?: string | null;
}

export type CreateSearchRecordParams = Pick<
    SearchRecord,
    "originalId" | "title" | "content" | "type" | "location" | "data"
>;

export interface UpdateSearchRecordParams {
    title?: string;
    content?: string;
    location?: Location;
    data?: Record<string, any>;
}

export interface DeleteSearchRecordParams {
    id: string;
}

export interface DeleteSearchRecordsParams {
    tenant: string;
    locale: string;
    locations: Location[];
}

export interface StorageOperationsGetSearchRecordParams {
    id: string;
}

export type StorageOperationsListSearchRecordsParams = ListSearchRecordsParams;

export interface StorageOperationsCreateSearchRecordParams {
    data: CreateSearchRecordParams;
}
export interface StorageOperationsUpdateSearchRecordParams {
    id: string;
    data: UpdateSearchRecordParams;
}
export type StorageOperationsDeleteSearchRecordParams = DeleteSearchRecordParams;
export type StorageOperationsDeleteSearchRecordsParams = DeleteSearchRecordsParams;

export interface OnSearchRecordBeforeCreateTopicParams {
    input: CreateSearchRecordParams;
}

export interface OnSearchRecordAfterCreateTopicParams {
    record: SearchRecord;
}

export interface OnSearchRecordBeforeUpdateTopicParams {
    original: SearchRecord;
    input: Record<string, any>;
}

export interface OnSearchRecordAfterUpdateTopicParams {
    original: SearchRecord;
    record: SearchRecord;
    input: Record<string, any>;
}

export interface OnSearchRecordBeforeDeleteTopicParams {
    record: SearchRecord;
}

export interface OnSearchRecordAfterDeleteTopicParams {
    record: SearchRecord;
}

export interface OnSearchRecordBeforeDeleteBatchTopicParams {
    locations: Location[];
}

export interface OnSearchRecordAfterDeleteBatchTopicParams {
    locations: Location[];
}

export interface AcoSearchRecordCrud
    extends BaseAcoCrud<SearchRecord, CreateSearchRecordParams, UpdateSearchRecordParams> {
    list(params: ListSearchRecordsParams): Promise<[SearchRecord[], ListMeta]>;
    onSearchRecordBeforeCreate: Topic<OnSearchRecordBeforeCreateTopicParams>;
    onSearchRecordAfterCreate: Topic<OnSearchRecordAfterCreateTopicParams>;
    onSearchRecordBeforeUpdate: Topic<OnSearchRecordBeforeUpdateTopicParams>;
    onSearchRecordAfterUpdate: Topic<OnSearchRecordAfterUpdateTopicParams>;
    onSearchRecordBeforeDelete: Topic<OnSearchRecordBeforeDeleteTopicParams>;
    onSearchRecordAfterDelete: Topic<OnSearchRecordAfterDeleteTopicParams>;
}
export interface AcoSearchRecordStorageOperations {
    getRecord(params: StorageOperationsGetSearchRecordParams): Promise<SearchRecord>;
    listRecords(
        params: StorageOperationsListSearchRecordsParams
    ): Promise<[SearchRecord[], ListMeta]>;
    createRecord(params: StorageOperationsCreateSearchRecordParams): Promise<SearchRecord>;
    updateRecord(params: StorageOperationsUpdateSearchRecordParams): Promise<SearchRecord>;
    deleteRecord(params: StorageOperationsDeleteSearchRecordParams): Promise<boolean>;
    //deleteRecords(params: StorageOperationsDeleteSearchRecordsParams): Promise<boolean>;
}
