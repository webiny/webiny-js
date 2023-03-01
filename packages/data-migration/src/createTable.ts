import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";

export interface CreateTableParams {
    name: string;
    documentClient: DocumentClient;
}

export const createTable = ({ name, documentClient }: CreateTableParams) => {
    return new Table({
        name,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
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
