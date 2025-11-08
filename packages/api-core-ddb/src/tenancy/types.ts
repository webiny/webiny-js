import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export enum ENTITIES {
    TENANT = "TenancyTenant"
}

export interface CreateTenancyStorageOperations {
    (params: { documentClient: DynamoDBDocument }): TenancyStorageOperations;
}
