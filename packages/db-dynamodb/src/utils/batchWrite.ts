import { Table } from "dynamodb-toolbox";
import lodashChunk from "lodash.chunk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

interface Item {
    [key: string]: DocumentClient.WriteRequest;
}
interface Params {
    table: Table;
    items: Item[];
}

/**
 * Method is meant for batch writing to a single table.
 * It expects already prepared items for the write.
 */
export const batchWriteAll = async (params: Params, maxChunk = 25): Promise<void> => {
    const chunkedItems: Item[][] = lodashChunk(params.items, maxChunk);
    for (const items of chunkedItems) {
        await params.table.batchWrite(items);
    }
};
