import { AcoBaseFields, ListMeta } from "~/types";
import { Topic } from "@webiny/pubsub/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export type GenericSearchData = {
    [key: string]: any;
};

export interface Location {
    folderId: string;
}

export interface SearchRecord<TData extends GenericSearchData = GenericSearchData>
    extends AcoBaseFields {
    type: string;
    title: string;
    content?: string;
    location: Location;
    data: TData;
    tags: string[];
}

export interface SearchRecordTag {
    tag: string;
    count: number;
}

export interface ListSearchRecordsWhere<TData extends GenericSearchData = GenericSearchData> {
    type: string;
    location?: {
        folderId: string;
    };
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
    data?: TData;
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
    "id" | "title" | "content" | "type" | "location" | "data" | "tags"
>;

export interface UpdateSearchRecordParams<TData extends GenericSearchData> {
    title?: string;
    content?: string;
    location?: Location;
    data?: TData;
    tags?: string[];
}

export interface DeleteSearchRecordParams {
    id: string;
}

export interface ListSearchRecordTagsWhere {
    type: string;
}

export interface ListSearchRecordTagsParams {
    where?: ListSearchRecordTagsWhere;
}

export interface StorageOperationsGetSearchRecordParams {
    id: string;
}

export type StorageOperationsListSearchRecordsParams = ListSearchRecordsParams;
export type StorageOperationsListSearchRecordTagsParams = ListSearchRecordTagsParams;

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

export interface StorageOperationsMoveSearchRecordParams {
    id: string;
    folderId?: string | null;
}

export type StorageOperationsDeleteSearchRecordParams = DeleteSearchRecordParams;

export interface OnSearchRecordBeforeCreateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    input: CreateSearchRecordParams<TData>;
}

export interface OnSearchRecordAfterCreateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    record: SearchRecord<TData>;
}

export interface OnSearchRecordBeforeUpdateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    original: SearchRecord<TData>;
    input: Record<string, any>;
}

export interface OnSearchRecordBeforeMoveTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    original: SearchRecord<TData>;
    folderId?: string | null;
}

export interface OnSearchRecordAfterMoveTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    original: SearchRecord<TData>;
    folderId?: string | null;
}

export interface OnSearchRecordAfterUpdateTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    original: SearchRecord<TData>;
    record: SearchRecord<TData>;
    input: Record<string, any>;
}

export interface OnSearchRecordBeforeDeleteTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    record: SearchRecord<TData>;
}

export interface OnSearchRecordAfterDeleteTopicParams<
    TData extends GenericSearchData = GenericSearchData
> {
    model: CmsModel;
    record: SearchRecord<TData>;
}

export interface AcoSearchRecordCrudBase {
    get<TData extends GenericSearchData = GenericSearchData>(
        id: string
    ): Promise<SearchRecord<TData>>;
    list<TData extends GenericSearchData = GenericSearchData>(
        params: ListSearchRecordsParams
    ): Promise<[SearchRecord<TData>[], ListMeta]>;
    listTags(params: ListSearchRecordTagsParams): Promise<[SearchRecordTag[], ListMeta]>;
    create<TData extends GenericSearchData = GenericSearchData>(
        data: CreateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    update<TData extends GenericSearchData = GenericSearchData>(
        id: string,
        data: UpdateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    move(id: string, folderId?: string | null): Promise<boolean>;
    delete(id: string): Promise<Boolean>;
}

export interface AcoSearchRecordCrud
    extends Omit<
        AcoSearchRecordCrudBase,
        "get" | "list" | "create" | "update" | "delete" | "listTags" | "move"
    > {
    get<TData>(model: CmsModel, id: string): Promise<SearchRecord<TData>>;
    list<TData>(
        model: CmsModel,
        params: ListSearchRecordsParams
    ): Promise<[SearchRecord<TData>[], ListMeta]>;
    listTags(
        model: CmsModel,
        params: ListSearchRecordTagsParams
    ): Promise<[SearchRecordTag[], ListMeta]>;
    create<TData>(
        model: CmsModel,
        data: CreateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    update<TData>(
        model: CmsModel,
        id: string,
        data: UpdateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    move(model: CmsModel, id: string, folderId?: string | null): Promise<boolean>;
    delete(model: CmsModel, id: string): Promise<Boolean>;
    onSearchRecordBeforeCreate: Topic<OnSearchRecordBeforeCreateTopicParams>;
    onSearchRecordAfterCreate: Topic<OnSearchRecordAfterCreateTopicParams>;
    onSearchRecordBeforeUpdate: Topic<OnSearchRecordBeforeUpdateTopicParams>;
    onSearchRecordAfterUpdate: Topic<OnSearchRecordAfterUpdateTopicParams>;
    onSearchRecordBeforeMove: Topic<OnSearchRecordBeforeMoveTopicParams>;
    onSearchRecordAfterMove: Topic<OnSearchRecordAfterMoveTopicParams>;
    onSearchRecordBeforeDelete: Topic<OnSearchRecordBeforeDeleteTopicParams>;
    onSearchRecordAfterDelete: Topic<OnSearchRecordAfterDeleteTopicParams>;
}

export interface AcoSearchRecordStorageOperations {
    getRecord<TData extends GenericSearchData = GenericSearchData>(
        model: CmsModel,
        params: StorageOperationsGetSearchRecordParams
    ): Promise<SearchRecord<TData>>;
    listRecords<TData extends GenericSearchData = GenericSearchData>(
        model: CmsModel,
        params: StorageOperationsListSearchRecordsParams
    ): Promise<[SearchRecord<TData>[], ListMeta]>;
    listTags(
        model: CmsModel,
        params: StorageOperationsListSearchRecordTagsParams
    ): Promise<[SearchRecordTag[], ListMeta]>;
    createRecord<TData extends GenericSearchData = GenericSearchData>(
        model: CmsModel,
        params: StorageOperationsCreateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    updateRecord<TData extends GenericSearchData = GenericSearchData>(
        model: CmsModel,
        params: StorageOperationsUpdateSearchRecordParams<TData>
    ): Promise<SearchRecord<TData>>;
    moveRecord(model: CmsModel, params: StorageOperationsMoveSearchRecordParams): Promise<boolean>;
    deleteRecord(
        model: CmsModel,
        params: StorageOperationsDeleteSearchRecordParams
    ): Promise<boolean>;
}
