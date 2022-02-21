import { TableModifier } from "~/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface CreateElasticsearchTableParams {
    table?: TableModifier;
    documentClient: DocumentClient;
}
export const createElasticsearchTable = ({
    table,
    documentClient
}: CreateElasticsearchTableParams): Table => {
    const tableConfig = {
        name: process.env.DB_TABLE_ELASTICSEARCH,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
