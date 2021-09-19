import { Context } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { HttpContext } from "@webiny/handler-http/types";
import { PluginsContainer } from "@webiny/plugins";
import { Tenancy } from "./Tenancy";

export interface Tenant {
    id: string;
    name: string;
    description?: string;
    parent?: string | null;
}

export interface TenancyContext extends Context, HttpContext, DbContext {
    tenancy: Tenancy;
}

export interface CreateTenantInput {
    id?: string;
    name: string;
    description?: string;
    parent?: string | null;
}

export interface TenantsStorageOperationsFactoryParams {
    plugins: PluginsContainer;
}

export interface TenantsStorageOperationsFactory {
    (params: TenantsStorageOperationsFactoryParams): TenantsStorageOperations;
}

export interface ListTenantsParams {
    parent: string;
}

export interface TenantsStorageOperations {
    getTenantsByIds<TTenant extends Tenant = Tenant>(ids: string[]): Promise<TTenant[]>;
    listTenants<TTenant extends Tenant = Tenant>(params: ListTenantsParams): Promise<TTenant[]>;
    createTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant>;
    updateTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant>;
    deleteTenant(id: string): Promise<void>;
}

export interface System {
    version?: string;
}

export interface SystemStorageOperationsFactoryParams {
    plugins: PluginsContainer;
}

export interface SystemStorageOperationsFactory {
    (params: SystemStorageOperationsFactoryParams): SystemStorageOperations;
}

export interface SystemStorageOperations {
    get: () => Promise<System>;
    create: (data: System) => Promise<System>;
    update: (data: System) => Promise<System>;
}

// Tenant lifecycle callbacks

export interface TenantBeforeCreateCallbackParams {
    tenant: Tenant;
}

export interface TenantBeforeCreateCallback {
    (params: TenantBeforeCreateCallbackParams): Promise<void>;
}

export interface TenantAfterCreateCallbackParams {
    tenant: Tenant;
}

export interface TenantAfterCreateCallback {
    (params: TenantAfterCreateCallbackParams): Promise<void>;
}

export interface TenantBeforeUpdateCallbackParams {
    tenant: Tenant;
    inputData: Record<string, any>;
    updateData: Partial<Tenant>;
}

export interface TenantBeforeUpdateCallback {
    (params: TenantBeforeUpdateCallbackParams): Promise<void>;
}

export interface TenantAfterUpdateCallbackParams {
    tenant: Tenant;
    inputData: Record<string, any>;
}

export interface TenantAfterUpdateCallback {
    (params: TenantAfterUpdateCallbackParams): Promise<void>;
}

export interface TenantBeforeDeleteCallbackParams {
    tenant: Tenant;
}

export interface TenantBeforeDeleteCallback {
    (params: TenantBeforeDeleteCallbackParams): Promise<void>;
}

export interface TenantAfterDeleteCallbackParams {
    tenant: Tenant;
}

export interface TenantAfterDeleteCallback {
    (params: TenantAfterDeleteCallbackParams): Promise<void>;
}
