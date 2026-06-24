import type {
    BatchWriteItem,
    BatchWriteResult,
    IDeleteBatchItem,
    IPutBatchItem
} from "~/utils/batch/types.js";
import type { IScanParams, IScanResponse } from "~/utils/DynamoDocClient.js";
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type ITableScanParams = IScanParams;

export type ITableScanResponse<T> = IScanResponse<T>;

export interface ITable {
    table: DynamoDocClient;
    createWriter(): ITableWriteBatch;
    createReader(): ITableReadBatch;
    scan<T>(params: ITableScanParams): Promise<ITableScanResponse<T>>;
}

export interface ITableWriteBatch {
    readonly total: number;
    readonly items: BatchWriteItem[];
    put(schema: EntitySchema, item: IPutBatchItem): void;
    delete(schema: EntitySchema, item: IDeleteBatchItem): void;
    execute(): Promise<BatchWriteResult>;
    combine(items: BatchWriteItem[]): ITableWriteBatch;
}

export interface ITableReadBatchKey {
    PK: string;
    SK: string;
}

export interface ITableReadBatchBuilderGetResponse {
    Key: ITableReadBatchKey;
}

export interface ITableReadBatch {
    readonly total: number;
    readonly items: ITableReadBatchBuilderGetResponse[];
    get(schema: EntitySchema, input: ITableReadBatchKey | ITableReadBatchKey[]): void;
    execute<T = GenericRecord>(): Promise<T[]>;
}
