import { Table } from "dynamodb-toolbox";
import { DynamoDBClient, getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";

export interface CreateTableParams {
    name?: string;
    documentClient?: DynamoDBClient;
}

export const getPrimaryDynamoDbTable = (params?: CreateTableParams) => {
    const { name, documentClient } = params || {};

    return new Table({
        name: name || String(process.env.DB_TABLE),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient:
            documentClient ||
            getDocumentClient({
                endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
                tls: false,
                region: "local",
                credentials: { accessKeyId: "test", secretAccessKey: "test" }
            }),
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
            // GSI2: {
            //     partitionKey: "GSI2_PK",
            //     sortKey: "GSI2_SK"
            // }
        }
    });
};

export const getDynamoToEsTable = (params?: CreateTableParams) => {
    const { name, documentClient } = params || {};

    return getPrimaryDynamoDbTable({
        name: name || process.env.DB_TABLE_ELASTICSEARCH,
        documentClient
    });
};
