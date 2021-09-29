import {
    TenancyStorageOperations,
    TenancyStorageOperations as BaseTenantsStorageOperations,
} from "@webiny/api-tenancy/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

/**
 * @internal
 * @private
 */
export type DbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
};

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "TenancySystem",
    TENANT = "TenancyTenant"
}

export interface CreateTenancyStorageOperations {
    (params: {
        documentClient: DocumentClient;
        table?: string;
        attributes?: Record<ENTITIES, Attributes>;
    }): TenancyStorageOperations;
}

export interface TenancySystem {
    tenant: string;
    version: string;
}

export interface TenantsStorageOperations extends BaseTenantsStorageOperations {
    getTable(): Table;
    getEntities(): Record<"tenants" | "system", Entity<any>>;
}
