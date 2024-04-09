import { Table } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";

interface Params {
    documentClient: DynamoDBDocument;
    tableName?: string;
}

export const createElasticsearchTable = (params: Params): Table<string, string, string> => {
    const { tableName, documentClient } = params;
    return new Table({
        name: tableName || (process.env.DB_TABLE_ELASTICSEARCH as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        autoExecute: true,
        autoParse: true
    });
};
