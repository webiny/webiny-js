import lodashChunk from "lodash/chunk";
import { TableDef } from "~/toolbox";
import { WriteRequest } from "@webiny/aws-sdk/client-dynamodb";

export interface BatchWriteItem {
    [key: string]: WriteRequest;
}

export interface BatchWriteParams {
    table?: TableDef;
    items: BatchWriteItem[];
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
        [table: string]: WriteRequest[];
    };
}

export type BatchWriteResult = BatchWriteResponse[];

const hasUnprocessedItems = (result: BatchWriteResponse): boolean => {
    if (typeof result.next !== "function") {
        return false;
    }
    const items = result.UnprocessedItems;
    if (!items || typeof items !== "object") {
        return false;
    }
    const keys = Object.keys(items);
    return keys.some(key => {
        const value = items[key];
        if (!Array.isArray(value)) {
            return false;
        }
        return value.some(val => {
            return val.PutRequest || val.DeleteRequest;
        });
    });
};

const retry = async (input: BatchWriteResponse, results: BatchWriteResult): Promise<void> => {
    if (!hasUnprocessedItems(input)) {
        return;
    }
    const result = await input.next!();
    await retry(result, results);
};
/**
 * Method is meant for batch writing to a single table.
 * It expects already prepared items for writing.
 * It can either delete or put items
 * The method does not check items before actually sending them into the underlying library.
 */
export const batchWriteAll = async (
    params: BatchWriteParams,
    maxChunk = 25
): Promise<BatchWriteResult> => {
    const { items: collection, table } = params;
    if (!table) {
        console.log("No table provided.");
        return [];
    } else if (collection.length === 0) {
        return [];
    }

    const chunkedItems: BatchWriteItem[][] = lodashChunk(collection, maxChunk);
    const results: BatchWriteResult = [];
    for (const items of chunkedItems) {
        const result = (await table.batchWrite(items, {
            execute: true
        })) as BatchWriteResponse;
        results.push(result);
        await retry(result, results);
    }
    return results;
};
