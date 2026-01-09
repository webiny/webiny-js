import type { Entity as BaseEntity } from "dynamodb-toolbox";
import type {
    BatchWriteItem,
    BatchWriteResult,
    IDeleteBatchItem,
    IPutBatchItem
} from "~/utils/batch/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { TableDef } from "~/toolbox.js";
import type { ITableWriteBatch } from "~/utils/table/types.js";
import type { IPutParamsItem, put } from "~/utils/put.js";
import {
    queryAll,
    queryAllClean,
    type QueryAllParams,
    queryOne,
    queryOneClean,
    type QueryOneParams
} from "~/utils/query.js";
import type { get, getClean, GetRecordParamsKeys } from "~/utils/get.js";
import type { deleteItem, IDeleteItemKeys } from "~/utils/delete.js";
import type { batchReadAll, BatchReadItem } from "~/utils/batch/batchRead.js";
import type { IEntityWriteBatchParams } from "./EntityWriteBatch.js";
import type { IEntityReadBatchParams } from "./EntityReadBatch.js";

export type IEntityQueryOneParams = Omit<QueryOneParams, "entity">;

export type IEntityQueryAllParams = Omit<QueryAllParams, "entity">;

export interface IEntityCreateEntityWriterParams<T = GenericRecord>
    extends Omit<IEntityWriteBatchParams<T>, "entity"> {}
export interface IEntityCreateEntityReaderParams extends Omit<IEntityReadBatchParams, "entity"> {}

export type IEntityPutResult = ReturnType<typeof put>;
export type IEntityGetResult<T> = ReturnType<typeof get<T>>;
export type IEntityGetCleanResult<T> = ReturnType<typeof getClean<T>>;
export type IEntityDeleteResult = ReturnType<typeof deleteItem>;
export type IEntityQueryOneResult<T> = ReturnType<typeof queryOne<T>>;
export type IEntityQueryOneCleanResult<T> = ReturnType<typeof queryOneClean<T>>;
export type IEntityQueryAllResult<T> = ReturnType<typeof queryAll<T>>;
export type IEntityQueryAllCleanResult<T> = ReturnType<typeof queryAllClean<T>>;

export interface IEntity<T extends GenericRecord = GenericRecord> {
    readonly entity: BaseEntity;
    readonly name: string;
    readonly table: TableDef;
    createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch;
    createEntityWriter(params?: IEntityCreateEntityWriterParams<T>): IEntityWriteBatch<T>;
    createTableWriter(): ITableWriteBatch;
    put(item: IPutParamsItem<T>): IEntityPutResult;
    get(keys: GetRecordParamsKeys): IEntityGetResult<T>;
    getClean(keys: GetRecordParamsKeys): IEntityGetCleanResult<T>;
    delete(keys: IDeleteItemKeys): IEntityDeleteResult;
    queryOne(params: IEntityQueryOneParams): IEntityQueryOneResult<T>;
    queryOneClean(params: IEntityQueryOneParams): IEntityQueryOneCleanResult<T>;
    queryAll(params: IEntityQueryAllParams): IEntityQueryAllResult<T>;
    queryAllClean(params: IEntityQueryAllParams): IEntityQueryAllCleanResult<T>;
}

export interface IEntityWriteBatchBuilder {
    // readonly entity: Entity;
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

export interface IEntityReadBatch {
    readonly total: number;
    readonly items: BatchReadItem[];
    get(input: IEntityReadBatchKey | IEntityReadBatchKey[]): void;
    execute<T = GenericRecord>(): ReturnType<typeof batchReadAll<T>>;
}

export interface IEntityReadBatchBuilderGetResponse {
    Table: TableDef;
    Key: IEntityReadBatchKey;
}

export interface IEntityReadBatchBuilder {
    get(item: IEntityReadBatchKey): IEntityReadBatchBuilderGetResponse;
}
