import { DbContext } from "@webiny/handler-db/types";
import { Topic } from "@webiny/pubsub/types";
import { WcpContext } from "@webiny/api-wcp/types";
import { Context as BaseContext } from "@webiny/handler/types";

export interface TenantDomain {
    fqdn: string;
}

export interface TenantSettings {
    domains: TenantDomain[];
}

export interface Tenant {
    id: string;
    name: string;
    description: string;
    tags: string[];
    status: string;
    settings: TenantSettings;
    parent: string | null;
    webinyVersion?: string;
    createdOn: string;
    savedOn: string;
}

export interface Tenancy {
    onTenantBeforeCreate: Topic<TenantBeforeCreateEvent>;
    onTenantAfterCreate: Topic<TenantAfterCreateEvent>;
    onTenantBeforeUpdate: Topic<TenantBeforeUpdateEvent>;
    onTenantAfterUpdate: Topic<TenantAfterUpdateEvent>;
    onTenantBeforeDelete: Topic<TenantBeforeDeleteEvent>;
    onTenantAfterDelete: Topic<TenantAfterDeleteEvent>;
    onTenantAfterInstall: Topic;
    isMultiTenant(): boolean;
    getStorageOperations(): TenancyStorageOperations;
    getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant;
    setCurrentTenant(tenant: Tenant): void;
    getVersion(): Promise<string | null>;
    setVersion(version: string): Promise<void>;
    install(): Promise<void>;
    getRootTenant(): Promise<Tenant>;
    getTenantById<TTenant extends Tenant = Tenant>(id: string): Promise<TTenant>;
    listTenants<TTenant extends Tenant = Tenant>(params?: ListTenantsParams): Promise<TTenant[]>;
    createTenant<TTenant extends Tenant = Tenant>(data: CreateTenantInput): Promise<TTenant>;
    updateTenant<TTenant extends Tenant = Tenant>(
        id: string,
        data: Partial<TTenant>
    ): Promise<TTenant>;
    deleteTenant(id: string): Promise<boolean>;
    withRootTenant<T>(cb: () => T): Promise<T>;
    withEachTenant<TTenant extends Tenant, TReturn>(
        tenants: TTenant[],
        cb: (tenant: TTenant) => Promise<TReturn>
    ): Promise<TReturn[]>;
    withTenant<TTenant extends Tenant, TReturn>(
        tenant: TTenant,
        cb: (tenant: TTenant) => Promise<TReturn>
    ): Promise<TReturn>;
}

export interface TenancyContext extends BaseContext, DbContext, WcpContext {
    tenancy: Tenancy;
}

export interface CreateTenantInput {
    id?: string;
    name: string;
    description: string;
    tags: string[];
    status?: string;
    settings?: TenantSettings;
    parent: string;
}

export interface ListTenantsParams {
    parent?: string;
}

export interface TenancyStorageOperations {
    getTenantsByIds<TTenant extends Tenant = Tenant>(ids: readonly string[]): Promise<TTenant[]>;
    listTenants<TTenant extends Tenant = Tenant>(params?: ListTenantsParams): Promise<TTenant[]>;
    createTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant>;
    updateTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant>;
    deleteTenant(id: string): Promise<void>;
    getSystemData(): Promise<System | null>;
    createSystemData(data: System): Promise<System>;
    updateSystemData(data: System): Promise<System>;
}

export interface System {
    version?: string;
}

// Tenant lifecycle events
export interface TenantBeforeCreateEvent {
    tenant: Tenant;
    input: CreateTenantInput & Record<string, any>;
}

export interface TenantAfterCreateEvent {
    tenant: Tenant;
    input: CreateTenantInput & Record<string, any>;
}

export interface TenantBeforeUpdateEvent {
    tenant: Tenant;
    inputData: Record<string, any>;
    updateData: Partial<Tenant>;
}

export interface TenantAfterUpdateEvent {
    tenant: Tenant;
    inputData: Record<string, any>;
}

export interface TenantBeforeDeleteEvent {
    tenant: Tenant;
}

export interface TenantAfterDeleteEvent {
    tenant: Tenant;
}
