import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AttributeDefinition } from "@webiny/db-dynamodb/toolbox.js";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
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
