import { TableModifier } from "~/types";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "dynamodb-toolbox";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";

export interface CreateTableParams {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}
export const createTable = ({ table, documentClient }: CreateTableParams): Table => {
    const tableConfig: TableConstructor = {
        name: process.env.DB_TABLE_HEADLESS_CMS || (process.env.DB_TABLE as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
