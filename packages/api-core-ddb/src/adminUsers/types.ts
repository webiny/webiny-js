import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AttributeDefinition, Table } from "@webiny/db-dynamodb/toolbox.js";
import type { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import type { IAdminUserEntity } from "~/adminUsers/definitions/types.js";

export type Attributes = Record<string, AttributeDefinition>;

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
    getTable(): Table<string, string, string>;
    getEntities(): IAdminUsersGetEntitiesResponse;
}
