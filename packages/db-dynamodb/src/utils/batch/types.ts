import type { WriteRequest } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface BatchWriteResponse {
    next?: () => Promise<BatchWriteResponse>;
    $metadata: {
        httpStatusCode: number;
        requestId: string;
        attempts: number;
        totalRetryDelay: number;
    };
    UnprocessedItems?: {
        [table: string]: WriteRequest[];
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
    // TODO always must be present
    GSI_TENANT: string;
} & T;

export interface BatchWriteItem {
    [key: string]: WriteRequest;
}

export interface IReadBatchItem {
    PK: string;
    SK: string;
}
