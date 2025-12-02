import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { Table } from "@webiny/db-dynamodb/toolbox.js";

export interface CreateTableParams {
    table?: string;
    documentClient: DynamoDBDocument;
}

export const createTable = ({ table, documentClient }: CreateTableParams) => {
    return new Table({
        name: table || (process.env.DB_TABLE as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
        },
        autoExecute: true,
        autoParse: true
    });
};
