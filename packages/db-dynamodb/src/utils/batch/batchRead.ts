import { WebinyError } from "@webiny/error";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface BatchReadItem {
    Key: any;
}

export interface BatchReadParams {
    client: DynamoDbDocumentClient.Interface;
    items: BatchReadItem[];
}

const MAX_BATCH_ITEMS = 100;

export const batchReadAll = async <T = GenericRecord>(
    params: BatchReadParams,
    maxChunk = MAX_BATCH_ITEMS
): Promise<T[]> => {
    if (params.items.length === 0) {
        return [];
    }

    if (maxChunk > MAX_BATCH_ITEMS) {
        throw new WebinyError(
            `Cannot set to load more than ${MAX_BATCH_ITEMS} items from the DynamoDB at once.`,
            "DYNAMODB_MAX_BATCH_GET_LIMIT_ERROR",
            { maxChunk }
        );
    }

    const keys = params.items.map(item => item.Key);
    const result = await params.client.batchGet<T>(keys, maxChunk);
    return result;
};
