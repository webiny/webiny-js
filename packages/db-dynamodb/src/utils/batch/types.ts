import type { WriteRequest } from "@webiny/aws-sdk/client-dynamodb/index.js";

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

export type IPutBatchItem<T extends Record<string, any> = Record<string, any>> = {
    PK: string;
    SK: string;
    // TODO always must be present
    GSI_TENANT: string;
} & T;

export interface BatchWriteItem {
    [key: string]: WriteRequest;
}
