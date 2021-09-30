import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface Params {
    table: string;
    documentClient: DocumentClient;
}

export const createTable = ({ table, documentClient }: Params) => {
    return new Table({
        name: table || process.env.DB_TABLE_TENANCY || process.env.DB_TABLE,
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
