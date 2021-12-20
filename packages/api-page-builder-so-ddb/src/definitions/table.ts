import { Table } from "dynamodb-toolbox";
import { TableModifier } from "~/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

interface IndexParams {
    partitionKey: string;
    sortKey: string;
}

export interface Params {
    table?: TableModifier;
    documentClient: DocumentClient;
    indexes?: {
        [key: string]: IndexParams;
    };
}
export const createTable = ({ table, documentClient, indexes }: Params): Table => {
    const tableConfig = {
        name: process.env.DB_PAGE_BUILDER || process.env.DB_TABLE,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
