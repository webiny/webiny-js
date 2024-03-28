import {
    TenancyStorageOperations,
    TenancyStorageOperations as BaseTenantsStorageOperations
} from "@webiny/api-tenancy/types";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { TableConstructor } from "@webiny/db-dynamodb/toolbox";
import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    SYSTEM = "TenancySystem",
    TENANT = "TenancyTenant",
    DOMAIN = "TenancyDomain"
}

export interface TableModifier {
    (table: TableConstructor<string, string, string>): TableConstructor<string, string, string>;
}

export interface CreateTenancyStorageOperations {
    (params: {
        documentClient: DynamoDBDocument;
        table?: TableModifier;
        attributes?: Record<ENTITIES, Attributes>;
    }): TenancyStorageOperations;
}

export interface TenancySystem {
    tenant: string;
    version: string;
}

export interface TenantsStorageOperations extends BaseTenantsStorageOperations {
    getTable(): Table<string, string, string>;
    getEntities(): Record<"tenants" | "system" | "domain", Entity<any>>;
}
