import type {
    BatchWriteItem,
    BatchWriteResult,
    IDeleteBatchItem,
    IPutBatchItem
} from "~/utils/batch/types.js";
import type { BaseScanParams, ScanResponse } from "../scan.js";
import type { Entity } from "~/toolbox.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { Table } from "~/toolbox.js";

export type ITableScanParams = BaseScanParams;

export type ITableScanResponse<T> = ScanResponse<T>;

export interface ITable<
    Name extends string = string,
    PK extends string = string,
    SK extends string = string
> {
    table: Table<Name, PK, SK>;
    createWriter(): ITableWriteBatch;
    createReader(): ITableReadBatch;
    scan<T>(params: ITableScanParams): Promise<ITableScanResponse<T>>;
}

export interface ITableWriteBatch {
    readonly total: number;
    readonly items: BatchWriteItem[];
    put(entity: Entity, item: IPutBatchItem): void;
    delete(entity: Entity, item: IDeleteBatchItem): void;
    execute(): Promise<BatchWriteResult>;
    combine(items: BatchWriteItem[]): ITableWriteBatch;
}

export interface ITableReadBatchKey {
    PK: string;
    SK: string;
}

export interface ITableReadBatchBuilderGetResponse {
    Table: Table<string, string, string>;
    Key: ITableReadBatchKey;
}

export interface ITableReadBatchKey {
    PK: string;
    SK: string;
}

export interface ITableReadBatch {
    readonly total: number;
    readonly items: ITableReadBatchBuilderGetResponse[];
    get(entity: Entity, input: ITableReadBatchKey | ITableReadBatchKey[]): void;
    execute<T = GenericRecord>(): Promise<T[]>;
}
