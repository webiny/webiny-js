import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";
import { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-admin-users/types";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "AdminUsers.System",
    USERS = "AdminUsers.User"
}

export interface CreateAdminUsersStorageOperations {
    (params: {
        documentClient: DynamoDBDocument;
        table?: string;
        attributes?: Record<ENTITIES, Attributes>;
    }): AdminUsersStorageOperations;
}

export interface AdminUsersStorageOperations extends BaseAdminUsersStorageOperations {
    getTable(): Table<string, string, string>;
    getEntities(): Record<"users" | "system", Entity<any>>;
}
