import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface Params {
    tableName: string;
    documentClient: DocumentClient;
}

export const createTable = (params: Params): Table => {
    const { tableName, documentClient } = params;

    return new Table({
        name: tableName || process.env.DB_TABLE_FORM_BUILDER || process.env.DB_TABLE,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
        }
    });
};
