import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface CreateTableParams {
    name?: string;
    documentClient: DocumentClient;
}

export const createTable = ({ name, documentClient }: CreateTableParams) => {
    return new Table({
        name: name || String(process.env.DB_TABLE),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
        }
    });
};
