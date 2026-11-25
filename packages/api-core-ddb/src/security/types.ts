import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

export enum ENTITIES {
    API_KEY = "SecurityApiKey",
    ROLE = "SecurityRole",
    TEAM = "SecurityTeam"
}

export interface SecurityStorageParams {
    documentClient: DynamoDBDocument;
    /** The tenant the storage acts on: its scope's. */
    scopeTenant: ScopeTenant.Interface;
    table?: string;
}
