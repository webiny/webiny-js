import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type {
    BatchWriteItem,
    BatchWriteResult,
    IDeleteBatchItem,
    IPutBatchItem
} from "~/utils/batch/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { ITableWriteBatch } from "~/utils/table/types.js";
import type { ITableReadBatch } from "~/utils/table/types.js";
import type { IPutParamsItem } from "~/utils/put.js";
import type { GetRecordParamsKeys } from "~/utils/get.js";
import type { IDeleteItemKeys } from "~/utils/delete.js";
import type { BatchReadItem } from "~/utils/batch/batchRead.js";
import type { IEntityWriteBatchParams } from "./EntityWriteBatch.js";
import type { IEntityReadBatchParams } from "./EntityReadBatch.js";
import type { IQueryPageResponse } from "~/utils/query.js";

export interface EntityQueryOptions {
    index?: string;
    limit?: number;
    reverse?: boolean;
    consistent?: boolean;
    eq?: string | number;
    lt?: string | number;
    lte?: string | number;
    gt?: string | number;
    gte?: string | number;
    between?: [string, string] | [number, number] | [bigint, bigint];
    beginsWith?: string;
    startKey?: Record<string, unknown>;
    filters?: Record<string, unknown>;
    attributes?: string[];
}

export type IEntityQueryOneParams = {
    partitionKey: string;
    options?: Omit<EntityQueryOptions, "limit">;
};

export type IEntityQueryAllParams = {
    partitionKey: string;
    options?: EntityQueryOptions;
};

export type IEntityQueryPerPageParams = {
    partitionKey: string;
    options?: EntityQueryOptions;
};

export interface IEntityCreateEntityWriterParams<T = GenericRecord> extends Omit<
    IEntityWriteBatchParams<T>,
    "schema" | "client"
> {}
export interface IEntityCreateEntityReaderParams extends Omit<
    IEntityReadBatchParams,
    "schema" | "client"
> {}

export interface IEntity<T extends GenericRecord = GenericRecord> {
    readonly schema: EntitySchema;
    readonly client: DynamoDbDocumentClient.Interface;
    readonly name: string;
    createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch<T>;
    createEntityWriter(params?: IEntityCreateEntityWriterParams<T>): IEntityWriteBatch<T>;
    createTableWriter(): ITableWriteBatch;
    createTableReader(): ITableReadBatch;
    put(item: IPutParamsItem<T>): Promise<void>;
    get<R extends T = T>(keys: GetRecordParamsKeys): Promise<R | null>;
    getClean<R extends T = T>(keys: GetRecordParamsKeys): Promise<R | null>;
    delete(keys: IDeleteItemKeys): Promise<void>;
    queryOne<R extends T = T>(params: IEntityQueryOneParams): Promise<R | null>;
    queryOneClean<R extends T = T>(params: IEntityQueryOneParams): Promise<R | null>;
    queryAll<R extends T = T>(params: IEntityQueryAllParams): Promise<R[]>;
    queryAllClean<R extends T = T>(params: IEntityQueryAllParams): Promise<R[]>;
    queryPerPage<R extends T = T>(
        params: IEntityQueryPerPageParams
    ): Promise<IQueryPageResponse<R>>;
}

export interface IEntityWriteBatchBuilder {
    put<T extends Record<string, any>>(item: IPutBatchItem<T>): BatchWriteItem;
    delete(item: IDeleteBatchItem): BatchWriteItem;
}

export interface IEntityWriteBatch<T = GenericRecord> {
    readonly total: number;
    readonly items: BatchWriteItem[];

    put(item: IPutBatchItem<T>): void;
    delete(item: IDeleteBatchItem): void;
    execute(): Promise<BatchWriteResult>;
    combine(items: BatchWriteItem[]): ITableWriteBatch;
}

export interface IEntityReadBatchKey {
    PK: string;
    SK: string;
}

export interface IEntityReadBatch<T = GenericRecord> {
    readonly total: number;
    readonly items: BatchReadItem[];
    get(input: IEntityReadBatchKey | IEntityReadBatchKey[]): void;
    execute(): Promise<T[]>;
}

export interface IEntityReadBatchBuilderGetResponse {
    Key: IEntityReadBatchKey;
}

export interface IEntityReadBatchBuilder {
    get(item: IEntityReadBatchKey): IEntityReadBatchBuilderGetResponse;
}
