import { TableModifier } from "../types";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { TableConstructor } from "@webiny/db-dynamodb/toolbox";

interface Params {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}
export const createTable = ({ table, documentClient }: Params): Table<string, string, string> => {
    const tableConfig: TableConstructor<string, string, string> = {
        name: process.env.DB_TABLE_ADMIN_SETTINGS || (process.env.DB_TABLE as string),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        autoExecute: true,
        autoParse: true
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
