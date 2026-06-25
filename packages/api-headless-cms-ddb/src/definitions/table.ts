import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";

interface Params {
    name?: string;
    tableFactory: DynamoDbTableFactory.Interface;
}

export const createTable = (params: Params): DynamoDbDocumentClient.Interface => {
    return params.tableFactory.create({
        name: params.name || process.env.DB_TABLE_HEADLESS_CMS || (process.env.DB_TABLE as string)
    });
};
