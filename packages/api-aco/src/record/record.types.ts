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
    "id" | "title" | "content" | "type" | "location" | "data"
>;

export interface UpdateSearchRecordParams<TData extends GenericSearchData> {
    title?: string;
    content?: string;
    location?: Location;
    data?: TData;
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
export interface StorageOperationsUpdateSearchRecordParams<
    TData extends GenericSearchData = GenericSearchData
> {
    id: string;
    data: UpdateSearchRecordParams<TData>;
}
export type StorageOperationsDeleteSearchRecordParams = DeleteSearchRecordParams;

export interface OnSearchRecordBeforeCreateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    input: CreateSearchRecordParams<TData>;
}

export interface OnSearchRecordAfterCreateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    record: SearchRecord<TData>;
}

export interface OnSearchRecordBeforeUpdateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    original: SearchRecord<TData>;
    input: Record<string, any>;
}

export interface OnSearchRecordAfterUpdateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    original: SearchRecord<TData>;
    record: SearchRecord<TData>;
    input: Record<string, any>;
}

export interface OnSearchRecordBeforeDeleteTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    record: SearchRecord<TData>;
}

export interface OnSearchRecordAfterDeleteTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    record: SearchRecord<TData>;
}

export interface AcoSearchRecordCrud {
    get<TData>(id: string): Promise<SearchRecord<TData>>;
    list<TData>(params: ListSearchRecordsParams): Promise<[SearchRecord<TData>[], ListMeta]>;
    create<TData>(data: CreateSearchRecordParams<TData>): Promise<SearchRecord<TData>>;
    update<TData>(id: string, data: UpdateSearchRecordParams<TData>): Promise<SearchRecord<TData>>;
    delete(id: string): Promise<Boolean>;
    onSearchRecordBeforeCreate: Topic<OnSearchRecordBeforeCreateTopicParams>;
    onSearchRecordAfterCreate: Topic<OnSearchRecordAfterCreateTopicParams>;
    onSearchRecordBeforeUpdate: Topic<OnSearchRecordBeforeUpdateTopicParams>;
    onSearchRecordAfterUpdate: Topic<OnSearchRecordAfterUpdateTopicParams>;
    onSearchRecordBeforeDelete: Topic<OnSearchRecordBeforeDeleteTopicParams>;
    onSearchRecordAfterDelete: Topic<OnSearchRecordAfterDeleteTopicParams>;
}
export interface AcoSearchRecordStorageOperations {
    getRecord<TData extends GenericSearchData = GenericSearchData>(
        params: StorageOperationsGetSearchRecordParams
    ): Promise<SearchRecord<TData>>;
    listRecords<TData extends GenericSearchData = GenericSearchData>(
        params: StorageOperationsListSearchRecordsParams
    ): Promise<[SearchRecord<TData>[], ListMeta]>;
    createRecord<TData extends GenericSearchData = GenericSearchData>(
        params: StorageOperationsCreateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    updateRecord<TData extends GenericSearchData = GenericSearchData>(
        params: StorageOperationsUpdateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    deleteRecord(params: StorageOperationsDeleteSearchRecordParams): Promise<boolean>;
}
