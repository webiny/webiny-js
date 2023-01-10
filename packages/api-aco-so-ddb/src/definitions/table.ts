import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface CreateTableParams {
    table?: string;
    documentClient: DocumentClient;
}

export const createTable = ({ table, documentClient }: CreateTableParams) => {
    return new Table({
        name: table || (process.env.DB_TABLE as string),
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
