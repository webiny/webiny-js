import { createTable as baseCreateTable } from "@webiny/db-dynamodb";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

interface Params {
    name?: string;
    documentClient: DynamoDBDocument;
}

export const createTable = (params: Params) => {
    return baseCreateTable({
        name: params.name || process.env.DB_TABLE_HEADLESS_CMS || (process.env.DB_TABLE as string),
        documentClient: params.documentClient
    });
};
