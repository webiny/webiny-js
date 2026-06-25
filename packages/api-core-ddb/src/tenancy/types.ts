import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";

export enum ENTITIES {
    TENANT = "TenancyTenant"
}

export interface CreateTenancyStorageOperations {
    (params: {
        tableFactory: DynamoDbTableFactory.Interface;
        entityFactory: DynamoDbEntityFactory.Interface;
    }): TenancyStorageOperations;
}
