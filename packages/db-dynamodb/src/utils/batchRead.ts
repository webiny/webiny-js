import { Table } from "dynamodb-toolbox";
import lodashChunk from "lodash/chunk";
import WebinyError from "@webiny/error";

interface Item {
    Table: Table;
    Key: any;
}
interface Params {
    table: Table;
    items: Item[];
}

const MAX_BATCH_ITEMS = 100;

const flatten = (responses: Record<string, any[]>): any[] => {
    const entries = [];
    const values = Object.values(responses);
    for (const items of values) {
        entries.push(...items);
    }
    return entries;
};

interface BatchReadAllChunkParams {
    table: Table;
    items: Item[];
}
const batchReadAllChunk = async <T = any>(params: BatchReadAllChunkParams): Promise<T[]> => {
    const { table, items } = params;
    const records: T[] = [];

    const result = await table.batchGet(items);
    if (!result || !result.Responses) {
        return records;
    }
    records.push(...flatten(result.Responses));
    if (!result.next || typeof result.next !== "function") {
        return records;
    }
    let previous = result;
    while (typeof previous.next === "function") {
        const nextResult = await previous.next();
        if (!nextResult) {
            return records;
        }
        records.push(...flatten(nextResult.Responses));
        previous = nextResult;
    }
    return records;
};
/**
 * This helper function is meant to be used to batch read from one table.
 * It will fetch all results, as there is a next() method call built in.
 */
export const batchReadAll = async <T = any>(
    params: Params,
    maxChunk = MAX_BATCH_ITEMS
): Promise<T[]> => {
    if (params.items.length === 0) {
        return [];
    } else if (maxChunk > MAX_BATCH_ITEMS) {
        throw new WebinyError(
            `Cannot set to load more than ${MAX_BATCH_ITEMS} items from the DynamoDB at once.`,
            "DYNAMODB_MAX_BATCH_GET_LIMIT_ERROR",
            {
                maxChunk
            }
        );
    }

    const records: T[] = [];

    const chunkItemsList: Item[][] = lodashChunk(params.items, maxChunk);

    for (const chunkItems of chunkItemsList) {
        const results = await batchReadAllChunk<T>({
            table: params.table,
            items: chunkItems
        });

        records.push(...results);
    }

    return records;
};
