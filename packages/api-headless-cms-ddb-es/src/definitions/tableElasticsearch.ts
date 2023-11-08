import { TableModifier } from "~/types";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { TableConstructor } from "@webiny/db-dynamodb/toolbox";

export interface CreateElasticsearchTableParams {
    table?: TableModifier;
    documentClient: DynamoDBClient;
}
export const createElasticsearchTable = ({
    table,
    documentClient
}: CreateElasticsearchTableParams): Table<string, string, string> => {
    const tableConfig: TableConstructor<string, string, string> = {
        name: process.env.DB_TABLE_ELASTICSEARCH as string,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        autoExecute: true,
        autoParse: true
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
