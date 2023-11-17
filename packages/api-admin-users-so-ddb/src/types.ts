import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-admin-users/types";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "AdminUsers.System",
    USERS = "AdminUsers.User"
}

export interface CreateAdminUsersStorageOperations {
    (params: {
        documentClient: DynamoDBClient;
        table?: string;
        attributes?: Record<ENTITIES, Attributes>;
    }): AdminUsersStorageOperations;
}

export interface AdminUsersStorageOperations extends BaseAdminUsersStorageOperations {
    getTable(): Table;
    getEntities(): Record<"users" | "system", Entity<any>>;
}
