import type { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import type { IAdminUserEntity } from "~/adminUsers/definitions/types.js";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";

export enum ENTITIES {
    SYSTEM = "AdminUsers.System",
    USERS = "AdminUsers.User"
}

export interface ICreateAdminUsersStorageOperationsParams {
    tableFactory: DynamoDbTableFactory.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    table?: string;
}

export interface CreateAdminUsersStorageOperations {
    (params: ICreateAdminUsersStorageOperationsParams): AdminUsersStorageOperations;
}

export interface IAdminUsersGetEntitiesResponse {
    users: IAdminUserEntity;
}

export interface AdminUsersStorageOperations extends BaseAdminUsersStorageOperations {
    getTable(): DynamoDbDocumentClient.Interface;
    getEntities(): IAdminUsersGetEntitiesResponse;
}
