import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createTable, type ITable } from "@webiny/db-dynamodb";

export interface ICreateOpenSearchTableParams {
    name?: string;
    documentClient: DynamoDBDocument;
}

export const createOpenSearchTable = ({
    name,
    documentClient
}: ICreateOpenSearchTableParams): ITable => {
    return createTable({
        name: name || (process.env.DB_TABLE_OPENSEARCH as string),
        indexes: {
            GSI_TENANT: {
                partitionKey: "GSI_TENANT"
            }
        },
        documentClient
    });
};
