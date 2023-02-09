import { AcoBaseFields, ListMeta } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export type GenericSearchData = {
    [key: string]: any;
};

export interface Location {
    folderId: string;
}

export interface SearchRecord<TData extends GenericSearchData = GenericSearchData>
    extends AcoBaseFields {
    originalId: string;
    type: string;
    title?: string;
    content?: string;
    location?: Location;
    data?: TData;
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

export type CreateSearchRecordParams<TData> = Pick<
    SearchRecord<TData>,
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

export interface StorageOperationsGetSearchRecordParams {
    id: string;
}

export type StorageOperationsListSearchRecordsParams = ListSearchRecordsParams;

export interface StorageOperationsCreateSearchRecordParams<
    TData extends GenericSearchData = GenericSearchData
> {
    data: CreateSearchRecordParams<TData>;
}
export interface StorageOperationsUpdateSearchRecordParams {
    id: string;
    data: UpdateSearchRecordParams;
}
export type StorageOperationsDeleteSearchRecordParams = DeleteSearchRecordParams;

export interface OnSearchRecordBeforeCreateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    input: CreateSearchRecordParams<TData>;
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

export interface AcoSearchRecordCrud {
    get(id: string): Promise<SearchRecord>;
    list(params: ListSearchRecordsParams): Promise<[SearchRecord[], ListMeta]>;
    create<TData>(data: CreateSearchRecordParams<TData>): Promise<SearchRecord>;
    update(id: string, data: UpdateSearchRecordParams): Promise<SearchRecord>;
    delete(id: string): Promise<Boolean>;
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
}
