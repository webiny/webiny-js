import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";

interface CreateTableParams {
    table?: string;
    documentClient: DynamoDBClient;
}

export const createTable = ({ table, documentClient }: CreateTableParams) => {
    return new Table({
        name: table || process.env.DB_TABLE_ADMIN_USERS || (process.env.DB_TABLE as string),
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
