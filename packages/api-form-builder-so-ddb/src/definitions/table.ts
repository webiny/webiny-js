import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";

interface Params {
    tableName?: string;
    documentClient: DynamoDBClient;
}

export const createTable = (params: Params): Table<string, string, string> => {
    const { tableName, documentClient } = params;

    return new Table({
        name: tableName || (process.env.DB_TABLE as string),
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
