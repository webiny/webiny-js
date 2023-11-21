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
export type DbItem<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
};

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "SecuritySystem",
    TENANT_LINK = "SecurityIdentity2Tenant",
    API_KEY = "SecurityApiKey",
    GROUP = "SecurityGroup",
    TEAM = "SecurityTeam"
}

export interface SecurityStorageParams {
    documentClient: DocumentClient;
    table?: string;
    attributes?: Record<ENTITIES, Attributes>;
}
