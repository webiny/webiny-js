import { TableModifier } from "../types";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "dynamodb-toolbox";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";

interface Params {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}
export const createTable = ({ table, documentClient }: Params): Table => {
    const tableConfig: TableConstructor = {
        name: process.env.DB_TABLE_ADMIN_SETTINGS || (process.env.DB_TABLE as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
