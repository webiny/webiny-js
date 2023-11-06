import { Table } from "dynamodb-toolbox";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";

interface Params {
    documentClient: DynamoDBClient;
    tableName?: string;
}

export const createElasticsearchTable = (params: Params): Table<string, string, string> => {
    const { tableName, documentClient } = params;
    return new Table({
        name: tableName || (process.env.DB_TABLE_ELASTICSEARCH as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    });
};
