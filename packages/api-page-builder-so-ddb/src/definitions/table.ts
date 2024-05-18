import { Table } from "@webiny/db-dynamodb/toolbox";
import { TableModifier } from "~/types";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { TableConstructor } from "@webiny/db-dynamodb/toolbox";

interface Params {
    table?: TableModifier;
    documentClient: DynamoDBDocument;
}
export const createTable = ({ table, documentClient }: Params): Table<string, string, string> => {
    const tableConfig: TableConstructor<string, string, string> = {
        name: process.env.DB_PAGE_BUILDER || (process.env.DB_TABLE as string),
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
