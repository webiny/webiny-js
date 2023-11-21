import { Table } from "dynamodb-toolbox";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

interface Params {
    documentClient: DocumentClient;
    tableName?: string;
}

export const createElasticsearchTable = (params: Params): Table => {
    const { tableName, documentClient } = params;
    return new Table({
        name: tableName || (process.env.DB_TABLE_ELASTICSEARCH as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    });
};
