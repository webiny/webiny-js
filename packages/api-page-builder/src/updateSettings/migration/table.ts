import { Table } from "dynamodb-toolbox";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

interface Params {
    documentClient: DocumentClient;
}
export const createTable = ({ documentClient }: Params) => {
    return new Table({
        name: process.env.DB_TABLE as string,
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
