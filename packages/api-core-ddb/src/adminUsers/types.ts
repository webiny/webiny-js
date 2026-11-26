import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import type { IAdminUserEntity } from "~/adminUsers/definitions/types.js";
import { ITable } from "@webiny/db-dynamodb";
import type { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

export enum ENTITIES {
    SYSTEM = "AdminUsers.System",
    USERS = "AdminUsers.User"
}

export interface ICreateAdminUsersStorageOperationsParams {
    documentClient: DynamoDBDocument;
    /** The tenant the storage acts on: its scope's. Reading one user across tenants doesn't use it. */
    scopeTenant: ScopeTenant.Interface;
    table?: string;
}

export interface CreateAdminUsersStorageOperations {
    (params: ICreateAdminUsersStorageOperationsParams): AdminUsersStorageOperations;
}

export interface IAdminUsersGetEntitiesResponse {
    users: IAdminUserEntity;
}

export interface AdminUsersStorageOperations extends BaseAdminUsersStorageOperations {
    getTable(): ITable;
    getEntities(): IAdminUsersGetEntitiesResponse;
}
