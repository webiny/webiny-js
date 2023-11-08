import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";

export interface CreateTableParams {
    name: string;
    documentClient: DynamoDBClient;
}

export const createTable = ({ name, documentClient }: CreateTableParams) => {
    return new Table({
        name,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
            // GSI2: {
            //     partitionKey: "GSI2_PK",
            //     sortKey: "GSI2_SK"
            // }
        },
        autoExecute: true,
        autoParse: true
    });
};
