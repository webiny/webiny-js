import { scan as tableScan, ScanOptions } from "@webiny/db-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { IElasticsearchIndexingTaskValuesKeys } from "~/types";

interface Params {
    table: Table<string, string, string>;
    keys?: IElasticsearchIndexingTaskValuesKeys;
    options?: Pick<ScanOptions, "limit">;
}

export const scan = async <T = any>(params: Params) => {
    const { table, keys } = params;
    return tableScan<T>({
        table,
        options: {
            startKey: keys,
            limit: 200,
            ...params.options
        }
    });
};
