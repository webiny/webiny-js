import { DbContext } from "@webiny/handler-db/types.js";
import { Context as BaseContext } from "@webiny/handler/types.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

export type TenantSettings = Record<string, any>;

export interface Tenant {
    id: string;
    name: string;
    description: string;
    image?: string;
    tags: string[];
    status: string;
    isInstalled: boolean;
    settings: TenantSettings;
    parent: string | null;
    webinyVersion?: string;
    createdOn: string;
    savedOn: string;
}

export interface CreateTenantInput {
    id?: string;
    name: string;
    description: string;
    image?: string;
    tags: string[];
    status?: string;
    settings?: TenantSettings;
    parent: string;
}

export interface ListTenantsParams {
    parent?: string;
}

export interface TenancyStorageOperations {
    getTenantsByIds(ids: readonly string[]): Promise<Tenant[]>;
    listTenants(params?: ListTenantsParams): Promise<Tenant[]>;
    createTenant(data: Tenant): Promise<Tenant>;
    updateTenant(data: Tenant): Promise<Tenant>;
    deleteTenant(id: string): Promise<void>;
}

// LEGACY CONTEXT
export interface TenancyContext extends BaseContext, DbContext, WcpContext.Interface {
    tenancy: Tenancy;
}

export interface Tenancy {
    getCurrentTenant(): Tenant;
    setCurrentTenant(tenant: Tenant): void;
    getRootTenant(): Promise<Tenant>;
    getTenantById(id: string): Promise<Tenant>;
    listTenants(params?: ListTenantsParams): Promise<Tenant[]>;
    createTenant(data: CreateTenantInput): Promise<Tenant>;
    withRootTenant<T>(cb: () => T): Promise<T>;
    withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]>;
    withTenant<TReturn>(tenant: Tenant, cb: (tenant: Tenant) => Promise<TReturn>): Promise<TReturn>;
}
