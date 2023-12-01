import lodashChunk from "lodash/chunk";
import WebinyError from "@webiny/error";
import { TableDef } from "~/toolbox";

export interface BatchReadItem {
    Table?: TableDef;
    Key: any;
}
export interface BatchReadParams {
    table?: TableDef;
    items: BatchReadItem[];
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
    table?: TableDef;
    items: BatchReadItem[];
}
const batchReadAllChunk = async <T = any>(params: BatchReadAllChunkParams): Promise<T[]> => {
    const { table, items } = params;
    const records: T[] = [];

    if (!table) {
        return records;
    }

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
    params: BatchReadParams,
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

    const chunkItemsList: BatchReadItem[][] = lodashChunk(params.items, maxChunk);

    for (const chunkItems of chunkItemsList) {
        const results = await batchReadAllChunk<T>({
            table: params.table,
            items: chunkItems
        });

        records.push(...results);
    }

    return records;
};
