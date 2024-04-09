import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";

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
    documentClient: DynamoDBDocument;
    table?: string;
    attributes?: Record<ENTITIES, Attributes>;
}
