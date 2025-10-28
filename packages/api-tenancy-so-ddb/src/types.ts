import type {
    TenancyStorageOperations,
    TenancyStorageOperations as BaseTenantsStorageOperations
} from "@webiny/api-core/types/tenancy.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Entity, Table } from "@webiny/db-dynamodb/toolbox.js";
import type { TableConstructor } from "@webiny/db-dynamodb/toolbox.js";
import type { AttributeDefinition } from "@webiny/db-dynamodb/toolbox.js";

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
