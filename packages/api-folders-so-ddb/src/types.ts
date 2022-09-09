import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

/**
 * @internal
 * @private
 */
export interface DataContainer<T> {
    PK: string;
    SK: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
    data: T;
}

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    FOLDER = "folder",
    LINK = "link"
}

export interface StorageParams {
    documentClient: DocumentClient;
    table?: string;
    attributes?: Record<ENTITIES, Attributes>;
}
