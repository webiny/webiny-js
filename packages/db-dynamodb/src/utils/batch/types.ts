import type { GenericRecord } from "@webiny/api/types.js";

export interface IWriteRequest {
    PutRequest?: { Item: GenericRecord };
    DeleteRequest?: { Key: GenericRecord };
}

export interface BatchWriteResponse {
    next?: () => Promise<BatchWriteResponse>;
    $metadata: {
        httpStatusCode: number;
        requestId: string;
        attempts: number;
        totalRetryDelay: number;
    };
    UnprocessedItems?: {
        [table: string]: IWriteRequest[];
    };
}

export type BatchWriteResult = BatchWriteResponse[];

export interface IDeleteBatchItem {
    PK: string;
    SK: string;
}

export type IPutBatchItem<T = GenericRecord> = {
    PK: string;
    SK: string;
} & T;

export interface BatchWriteItem {
    [key: string]: IWriteRequest;
}

export interface IReadBatchItem {
    PK: string;
    SK: string;
}
