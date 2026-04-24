import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import type { IAdminUserEntity } from "~/adminUsers/definitions/types.js";
import { ITable } from "@webiny/db-dynamodb";

export enum ENTITIES {
    SYSTEM = "AdminUsers.System",
    USERS = "AdminUsers.User"
}

export interface ICreateAdminUsersStorageOperationsParams {
    documentClient: DynamoDBDocument;
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
