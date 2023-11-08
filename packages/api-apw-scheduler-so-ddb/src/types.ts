import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";

export type Attributes = Record<string, AttributeDefinition>;

export interface PartitionKeyOptions {
    tenant: string;
    locale: string;
    id?: string;
}

export interface CreateStorageOperationsParams {
    documentClient: DynamoDBClient;
    table?: string;
    attributes?: Attributes;
}
