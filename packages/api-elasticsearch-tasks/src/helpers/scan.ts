import type { ScanOptions } from "@webiny/db-dynamodb";
import { scan as tableScan } from "@webiny/db-dynamodb";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { IElasticsearchIndexingTaskValuesKeys } from "~/types.js";

interface Params {
    table: DynamoDbDocumentClient.Interface;
    keys?: IElasticsearchIndexingTaskValuesKeys;
    options?: ScanOptions;
}

export const scan = async <T = any>(params: Params) => {
    const { table, keys } = params;
    return tableScan<T>({
        table,
        options: {
            ...params.options,
            startKey: keys,
            limit: params.options?.limit || 200
        }
    });
};
