import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";
import { TableModifier } from "~/types";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";

export interface Params {
    table?: TableModifier;
    documentClient: DocumentClient;
}

export const createTable = (params: Params): Table => {
    const { table, documentClient } = params;

    const tableConfig: TableConstructor = {
        name: (process.env.DB_TABLE_PRERENDERING_SERVICE || process.env.DB_TABLE) as string,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient
    };

    const config = typeof table === "function" ? table(tableConfig) : tableConfig;

    return new Table(config);
};
