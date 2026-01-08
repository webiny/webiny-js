import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { Table as BaseTable } from "~/toolbox.js";

export interface CreateTableParams {
    name?: string;
    documentClient: DynamoDBDocument;
}

export type Table = BaseTable<string, "PK", "SK">;

export const createTable = ({ name, documentClient }: CreateTableParams): Table => {
    return new BaseTable({
        name: name || String(process.env.DB_TABLE),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI_TENANT: {
                partitionKey: "GSI_TENANT"
            },
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            },
            GSI2: {
                partitionKey: "GSI2_PK",
                sortKey: "GSI2_SK"
            }
        },
        autoExecute: true,
        autoParse: true
    });
};
