import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "dynamodb-toolbox";
import { TableModifier } from "~/types";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";

interface CreateTableParams {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}

export const createTable = (params: CreateTableParams): Table<string, string, string> => {
    const { table, documentClient } = params;

    const tableConfig: TableConstructor<string, string, string> = {
        name: (process.env.DB_TABLE_PRERENDERING_SERVICE || process.env.DB_TABLE) as string,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
        }
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
