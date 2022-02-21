import { TableModifier } from "~/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

interface Params {
    table?: TableModifier;
    documentClient: DocumentClient;
}
export const createTable = ({ table, documentClient }: Params): Table => {
    const tableConfig = {
        name: process.env.DB_TABLE_HEADLESS_CMS || process.env.DB_TABLE,
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
