import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export enum ENTITIES {
    API_KEY = "SecurityApiKey",
    ROLE = "SecurityRole",
    TEAM = "SecurityTeam"
}

export interface SecurityStorageParams {
    documentClient: DynamoDBDocument;
    table?: string;
}
