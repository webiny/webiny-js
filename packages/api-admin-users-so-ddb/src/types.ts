import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Entity, Table } from "@webiny/db-dynamodb/toolbox.js";
import type { AttributeDefinition } from "@webiny/db-dynamodb/toolbox.js";
import type { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-core/types/users.js";

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
