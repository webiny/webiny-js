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

/**
 * Method is meant for batch writing to a single table.
 * It expects already prepared items for writing.
 * It can either delete or put items
 * The method does not check items before actually sending them into the underlying library.
 */
export const batchWriteAll = async (params: BatchWriteParams, maxChunk = 25): Promise<void> => {
    const { items: collection, table } = params;
    if (collection.length === 0 || !table) {
        return;
    }
    const chunkedItems: BatchWriteItem[][] = lodashChunk(collection, maxChunk);
    for (const items of chunkedItems) {
        await table.batchWrite(items, {
            execute: true
        });
    }
};
