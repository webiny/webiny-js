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
        autoExecute: true,
        autoParse: true
    });
};
