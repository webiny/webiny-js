import {
    TenancyStorageOperations,
    TenancyStorageOperations as BaseTenantsStorageOperations
} from "@webiny/api-tenancy/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes, TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "TenancySystem",
    TENANT = "TenancyTenant",
    DOMAIN = "TenancyDomain"
}

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface CreateTenancyStorageOperations {
    (params: {
        documentClient: DocumentClient;
        table?: TableModifier;
        attributes?: Record<ENTITIES, Attributes>;
    }): TenancyStorageOperations;
}

export interface TenancySystem {
    tenant: string;
    version: string;
}

export interface TenantsStorageOperations extends BaseTenantsStorageOperations {
    getTable(): Table;
    getEntities(): Record<"tenants" | "system" | "domain", Entity<any>>;
}
