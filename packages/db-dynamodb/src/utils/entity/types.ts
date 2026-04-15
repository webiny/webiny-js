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
import { queryPerPage } from "~/utils/index.js";

export type IEntityQueryOneParams = Omit<QueryOneParams, "entity">;

export type IEntityQueryAllParams = Omit<QueryAllParams, "entity">;
export type IEntityQueryPerPageParams = Omit<QueryAllParams, "entity">;

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
export type IEntityQueryPerPageResult<T> = ReturnType<typeof queryPerPage<T>>;

export interface IEntity<T extends GenericRecord = GenericRecord> {
    readonly entity: BaseEntity;
    readonly name: string;
    readonly table: TableDef;
    createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch<T>;
    createEntityWriter(params?: IEntityCreateEntityWriterParams<T>): IEntityWriteBatch<T>;
    createTableWriter(): ITableWriteBatch;
    put(item: IPutParamsItem<T>): IEntityPutResult;
    get<R extends T = T>(keys: GetRecordParamsKeys): IEntityGetResult<R>;
    getClean<R extends T = T>(keys: GetRecordParamsKeys): IEntityGetCleanResult<R>;
    delete(keys: IDeleteItemKeys): IEntityDeleteResult;
    queryOne<R extends T = T>(params: IEntityQueryOneParams): IEntityQueryOneResult<R>;
    queryOneClean<R extends T = T>(params: IEntityQueryOneParams): IEntityQueryOneCleanResult<R>;
    queryAll<R extends T = T>(params: IEntityQueryAllParams): IEntityQueryAllResult<R>;
    queryAllClean<R extends T = T>(params: IEntityQueryAllParams): IEntityQueryAllCleanResult<R>;
    queryPerPage<R extends T = T>(params: IEntityQueryPerPageParams): IEntityQueryPerPageResult<R>;
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

export interface IEntityReadBatch<T = GenericRecord> {
    readonly total: number;
    readonly items: BatchReadItem[];
    get(input: IEntityReadBatchKey | IEntityReadBatchKey[]): void;
    execute(): ReturnType<typeof batchReadAll<T>>;
}

export interface IEntityReadBatchBuilderGetResponse {
    Table: TableDef;
    Key: IEntityReadBatchKey;
}

export interface IEntityReadBatchBuilder {
    get(item: IEntityReadBatchKey): IEntityReadBatchBuilderGetResponse;
}
