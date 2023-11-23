import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { TableModifier } from "~/types";
import { TableConstructor } from "@webiny/db-dynamodb/toolbox";

interface CreateTableParams {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}

export const createTable = ({ table, documentClient }: CreateTableParams) => {
    const tableConfig: TableConstructor<string, string, string> = {
        name: (process.env.DB_TABLE_TENANCY || process.env.DB_TABLE) as string,
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
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
