import { Table } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";

export interface Params {
    table?: string;
    documentClient: DynamoDBClient;
}

export const createTable = ({ table, documentClient }: Params) => {
    return new Table({
        name: String(table || process.env.DB_TABLE),
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
