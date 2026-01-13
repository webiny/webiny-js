import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createTable, type ITable } from "@webiny/db-dynamodb";

export interface ICreateElasticsearchTableParams {
    name?: string;
    documentClient: DynamoDBDocument;
}

export const createElasticsearchTable = ({
    name,
    documentClient
}: ICreateElasticsearchTableParams): ITable => {
    return createTable({
        name: name || (process.env.DB_TABLE_ELASTICSEARCH as string),
        indexes: {
            GSI_TENANT: {
                partitionKey: "GSI_TENANT"
            }
        },
        documentClient
    });
};
