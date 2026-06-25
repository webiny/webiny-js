import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";

export enum ENTITIES {
    API_KEY = "SecurityApiKey",
    ROLE = "SecurityRole",
    TEAM = "SecurityTeam"
}

export interface SecurityStorageParams {
    tableFactory: DynamoDbTableFactory.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    table?: string;
}
