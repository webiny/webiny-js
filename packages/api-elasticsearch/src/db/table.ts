import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { TableConstructor, TableDef } from "@webiny/db-dynamodb/toolbox.js";
import { Table } from "@webiny/db-dynamodb/toolbox.js";

export interface ICreateElasticsearchTableParams {
    name?: string;
    documentClient: DynamoDBDocument;
}

export const createElasticsearchTable = ({
    name,
    documentClient
}: ICreateElasticsearchTableParams): TableDef => {
    const config: TableConstructor<string, string, string> = {
        name: name || (process.env.DB_TABLE_ELASTICSEARCH as string),
        partitionKey: "PK",
        sortKey: "SK",
        indexes: {
            GSI_TENANT: {
                partitionKey: "GSI_TENANT"
            }
        },
        DocumentClient: documentClient,
        autoExecute: true,
        autoParse: true
    };

    return new Table(config);
};
