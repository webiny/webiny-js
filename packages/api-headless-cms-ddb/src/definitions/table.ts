import { TableModifier } from "~/types";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "dynamodb-toolbox";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";

interface Params {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}
export const createTable = ({ table, documentClient }: Params): Table<string, string, string> => {
    const tableConfig: TableConstructor<string, string, string> = {
        name: process.env.DB_TABLE_HEADLESS_CMS || (process.env.DB_TABLE as string),
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
