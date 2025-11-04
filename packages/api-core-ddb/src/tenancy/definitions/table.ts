import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { Table } from "@webiny/db-dynamodb/toolbox.js";
import type { TableConstructor } from "@webiny/db-dynamodb/toolbox.js";

interface CreateTableParams {
    documentClient: DynamoDBDocument;
}

export const createTable = ({ documentClient }: CreateTableParams) => {
    const tableConfig: TableConstructor<string, string, string> = {
        name: (process.env.DB_TABLE_TENANCY || process.env.DB_TABLE) as string,
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

    return new Table(tableConfig);
};
