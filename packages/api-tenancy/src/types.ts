import { Context } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { HttpContext } from "@webiny/handler-http/types";
import { Topic } from "@webiny/pubsub/types";
import { WcpContext } from "@webiny/api-wcp/types";

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
    status: string;
    settings: TenantSettings;
    parent: string | null;
    webinyVersion?: string;
}

export interface Tenancy {
    onTenantBeforeCreate: Topic<TenantBeforeCreateEvent>;
    onTenantAfterCreate: Topic<TenantAfterCreateEvent>;
    onTenantBeforeUpdate: Topic<TenantBeforeUpdateEvent>;
    onTenantAfterUpdate: Topic<TenantAfterUpdateEvent>;
    onTenantBeforeDelete: Topic<TenantBeforeDeleteEvent>;
    onTenantAfterDelete: Topic<TenantAfterDeleteEvent>;
    isMultiTenant(): boolean;
    getStorageOperations(): TenancyStorageOperations;
    getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant;
    setCurrentTenant(tenant: Tenant): void;
    getVersion(): Promise<string | null>;
    setVersion(version: string): Promise<void>;
    install(): Promise<void>;
    getRootTenant(): Promise<Tenant>;
    getTenantById<TTenant extends Tenant = Tenant>(id: string): Promise<TTenant>;
    listTenants<TTenant extends Tenant = Tenant>(params: ListTenantsParams): Promise<TTenant[]>;
    createTenant<TTenant extends Tenant = Tenant>(data: CreateTenantInput): Promise<TTenant>;
    updateTenant<TTenant extends Tenant = Tenant>(
        id: string,
        data: Partial<TTenant>
    ): Promise<TTenant>;
    deleteTenant(id: string): Promise<boolean>;
}

export interface TenancyContext extends Context, HttpContext, DbContext, WcpContext {
    tenancy: Tenancy;
}

export interface CreateTenantInput {
    id?: string;
    name: string;
    description: string;
    status?: string;
    settings?: TenantSettings;
    parent: string;
}

export interface ListTenantsParams {
    parent: string;
}

export interface TenancyStorageOperations {
    getTenantsByIds<TTenant extends Tenant = Tenant>(ids: readonly string[]): Promise<TTenant[]>;
    listTenants<TTenant extends Tenant = Tenant>(params: ListTenantsParams): Promise<TTenant[]>;
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
}

export interface TenantAfterCreateEvent {
    tenant: Tenant;
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
