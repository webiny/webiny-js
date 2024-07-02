import { Table } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";

export interface CreateTableParams {
    name?: string;
    documentClient?: DynamoDBDocument;
}

export const getPrimaryDynamoDbTable = (params?: CreateTableParams) => {
    const { name, documentClient } = params || {};

    return new Table({
        name: name || String(process.env.DB_TABLE),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient || getDocumentClient(),
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
            // GSI2: {
            //     partitionKey: "GSI2_PK",
            //     sortKey: "GSI2_SK"
            // }
        },
        autoExecute: true,
        autoParse: true
    });
};

export const getDynamoToEsTable = (params?: CreateTableParams) => {
    const { name, documentClient } = params || {};

    return getPrimaryDynamoDbTable({
        name: name || process.env.DB_TABLE_ELASTICSEARCH,
        documentClient
    });
};
