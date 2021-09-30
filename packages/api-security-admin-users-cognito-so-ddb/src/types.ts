import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { AdminUsersStorageOperations as BaseAdminUsersStorageOperations } from "@webiny/api-security-admin-users-cognito/types";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

/**
 * @internal
 * @private
 */
export type DbItem<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "SecuritySystem",
    USER = "SecurityAdminUser"
}

export interface CreateSecurityStorageOperations {
    (params: {
        documentClient: DocumentClient;
        table?: string;
        attributes?: Record<ENTITIES, Attributes>;
    }): SecurityStorageOperations;
}

export interface SecurityStorageOperations extends BaseAdminUsersStorageOperations {
    getTable(): Table;
    getEntities(): Record<"tenants" | "system", Entity<any>>;
}
