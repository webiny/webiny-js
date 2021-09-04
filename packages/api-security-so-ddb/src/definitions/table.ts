import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";
import configurations from "~/configurations";

export interface Params {
    table: string;
    documentClient: DocumentClient;
}

export const createTable = ({ table, documentClient }: Params) => {
    return new Table({
        name: configurations.db().table || table,
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
