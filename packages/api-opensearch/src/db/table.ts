import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";

export interface ICreateOpenSearchTableParams {
    name?: string;
    tableFactory: DynamoDbTableFactory.Interface;
}

export const createOpenSearchTable = ({
    name,
    tableFactory
}: ICreateOpenSearchTableParams): DynamoDbDocumentClient.Interface => {
    return tableFactory.create({
        name: name || (process.env.DB_TABLE_OPENSEARCH as string),
        indexes: {
            GSI_TENANT: {
                partitionKey: "GSI_TENANT"
            }
        }
    });
};
