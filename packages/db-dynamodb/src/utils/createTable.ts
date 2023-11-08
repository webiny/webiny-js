import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "~/toolbox";

export interface CreateTableParams {
    name?: string;
    documentClient: DynamoDBClient;
}

export const createTable = ({ name, documentClient }: CreateTableParams) => {
    return new Table({
        name: name || String(process.env.DB_TABLE),
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
