import { TableModifier } from "~/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface CreateTableParams {
    table?: TableModifier;
    documentClient: DocumentClient;
}
export const createTable = ({ table, documentClient }: CreateTableParams): Table => {
    const tableConfig = {
        name: process.env.DB_TABLE_HEADLESS_CMS || process.env.DB_TABLE,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
