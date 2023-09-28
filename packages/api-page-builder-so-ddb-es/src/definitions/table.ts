import { Table } from "dynamodb-toolbox";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import { TableModifier } from "~/types";

interface Params {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}
export const createTable = ({ table, documentClient }: Params): Table => {
    const tableConfig: TableConstructor = {
        name: process.env.DB_PAGE_BUILDER || (process.env.DB_TABLE as string),
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
