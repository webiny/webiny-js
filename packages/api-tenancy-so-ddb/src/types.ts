import {
    TenancyStorageOperations as BaseTenantsStorageOperations,
    TenancyStorageOperationsFactory
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

export interface CreateTenancyStorageOperationsFactory {
    (params: {
        documentClient: DocumentClient;
        table?: string;
        attributes?: Record<ENTITIES, Attributes>;
    }): TenancyStorageOperationsFactory;
}

export interface TenancySystem {
    version: string;
}

export interface TenantsStorageOperations extends BaseTenantsStorageOperations {
    getTable(): Table;
    getEntities(): Record<"tenants" | "system", Entity<any>>;
}
