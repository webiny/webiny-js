export type TenantSettings = Record<string, any>;

export type TenantStatus = "enabled" | "disabled";

export interface Tenant {
    id: string;
    name: string;
    description: string;
    status: TenantStatus;
    isInstalled: boolean;
    settings: TenantSettings;
    tags: string[];
    parent: string | null;
    createdOn: string;
    savedOn: string;
}

export interface CreateTenantInput {
    id?: string;
    name: string;
    description: string;
    tags: string[];
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
