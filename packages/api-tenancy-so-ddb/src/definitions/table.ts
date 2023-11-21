import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";
import { TableModifier } from "~/types";
import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";

interface CreateTableParams {
    table?: TableModifier;
    documentClient: DocumentClient;
}

export const createTable = ({ table, documentClient }: CreateTableParams) => {
    const tableConfig: TableConstructor = {
        name: (process.env.DB_TABLE_TENANCY || process.env.DB_TABLE) as string,
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
