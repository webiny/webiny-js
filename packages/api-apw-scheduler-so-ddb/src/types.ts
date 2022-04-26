import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export interface PartitionKeyOptions {
    tenant: string;
    locale: string;
    id?: string;
}

export interface CreateStorageOperationsParams {
    documentClient: DocumentClient;
    table?: string;
    attributes?: Attributes;
}
