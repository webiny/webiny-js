import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { BatchWriteItem, BatchWriteResult } from "./types.js";

export interface BatchWriteParams {
    table: DynamoDbDocumentClient.Interface;
    items: BatchWriteItem[];
}

export const batchWriteAll = async (
    params: BatchWriteParams,
    maxChunk = 25
): Promise<BatchWriteResult> => {
    const { items: collection, table: client } = params;

    if (!client) {
        console.log("No client provided.");
        return [];
    }

    if (collection.length === 0) {
        return [];
    }

    /* Convert BatchWriteItem[] to the format DynamoDbDocumentClient expects. */
    const writeRequests = collection.map(item => {
        if (item.PutRequest) {
            return { PutRequest: item.PutRequest };
        }
        if (item.DeleteRequest) {
            return { DeleteRequest: item.DeleteRequest };
        }
        return item;
    });

    await client.batchWrite(writeRequests, maxChunk);
    return [];
};
