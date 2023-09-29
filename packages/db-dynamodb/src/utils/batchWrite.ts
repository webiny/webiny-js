import { TableDef } from "dynamodb-toolbox/dist/classes/Table";
import lodashChunk from "lodash/chunk";
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
 * It expects already prepared items for the write.
 * It can either delete or put items
 * The method does not check items before actually sending them into the underlying library.
 */
export const batchWriteAll = async (params: BatchWriteParams, maxChunk = 25): Promise<void> => {
    if (params.items.length === 0 || !params.table) {
        return;
    }
    const chunkedItems: BatchWriteItem[][] = lodashChunk(params.items, maxChunk);
    for (const items of chunkedItems) {
        await params.table.batchWrite(items);
    }
};
