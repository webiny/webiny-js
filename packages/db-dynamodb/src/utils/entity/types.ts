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

export interface IEntityCreateEntityWriterParams extends Omit<IEntityWriteBatchParams, "entity"> {}
export interface IEntityCreateEntityReaderParams extends Omit<IEntityReadBatchParams, "entity"> {}

export type IEntityPutResult = ReturnType<typeof put>;
export type IEntityGetResult<T> = ReturnType<typeof get<T>>;
export type IEntityGetCleanResult<T> = ReturnType<typeof getClean<T>>;
export type IEntityDeleteResult = ReturnType<typeof deleteItem>;
export type IEntityQueryOneResult<T> = ReturnType<typeof queryOne<T>>;
export type IEntityQueryOneCleanResult<T> = ReturnType<typeof queryOneClean<T>>;
export type IEntityQueryAllResult<T> = ReturnType<typeof queryAll<T>>;
export type IEntityQueryAllCleanResult<T> = ReturnType<typeof queryAllClean<T>>;

export interface IEntity {
    readonly entity: BaseEntity;
    readonly name: string;
    readonly table: TableDef;
    createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch;
    createEntityWriter(params?: IEntityCreateEntityWriterParams): IEntityWriteBatch;
    createTableWriter(): ITableWriteBatch;
    put<T extends GenericRecord = GenericRecord>(item: IPutParamsItem<T>): IEntityPutResult;
    get<T>(keys: GetRecordParamsKeys): IEntityGetResult<T>;
    getClean<T>(keys: GetRecordParamsKeys): IEntityGetCleanResult<T>;
    delete(keys: IDeleteItemKeys): IEntityDeleteResult;
    queryOne<T>(params: IEntityQueryOneParams): IEntityQueryOneResult<T>;
    queryOneClean<T>(params: IEntityQueryOneParams): IEntityQueryOneCleanResult<T>;
    queryAll<T>(params: IEntityQueryAllParams): IEntityQueryAllResult<T>;
    queryAllClean<T>(params: IEntityQueryAllParams): IEntityQueryAllCleanResult<T>;
}

export interface IEntityWriteBatchBuilder {
    // readonly entity: Entity;
    put<T extends Record<string, any>>(item: IPutBatchItem<T>): BatchWriteItem;
    delete(item: IDeleteBatchItem): BatchWriteItem;
}

export interface IEntityWriteBatch {
    readonly total: number;
    readonly items: BatchWriteItem[];

    put(item: IPutBatchItem): void;
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
